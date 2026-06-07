import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import lamejs from '@breezystack/lamejs';

// Support both .env and .env.local
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase Config');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const encodeToMp3 = (pcmData: Uint8Array, sampleRate = 24000): Uint8Array => {
    const int16Data = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2);
    const encoder = new lamejs.Mp3Encoder(1, sampleRate, 64);
    
    const maxSamples = 1152;
    const mp3Data: Int8Array[] = [];
    
    for (let i = 0; i < int16Data.length; i += maxSamples) {
        const chunk = int16Data.subarray(i, i + maxSamples);
        const encoded = encoder.encodeBuffer(chunk);
        if (encoded.length > 0) {
            mp3Data.push(encoded);
        }
    }
    
    const flush = encoder.flush();
    if (flush.length > 0) {
        mp3Data.push(flush);
    }
    
    const totalLength = mp3Data.reduce((acc, current) => acc + current.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of mp3Data) {
        result.set(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), offset);
        offset += chunk.length;
    }
    
    return result;
};

async function migrate() {
    console.log('Fetching all files from Supabase Storage bucket "audios"...');
    
    // Función recursiva para listar todos los archivos
    async function listAllFiles(bucketName: string, prefix: string = ''): Promise<string[]> {
        const files: string[] = [];
        const { data, error } = await supabase.storage.from(bucketName).list(prefix, { limit: 1000 });
        
        if (error || !data) {
            console.error(`Error listing prefix '${prefix}' in bucket '${bucketName}':`, error);
            return files;
        }

        for (const item of data) {
            if (item.name === '.emptyFolderPlaceholder') continue;
            
            const currentPath = prefix ? `${prefix}/${item.name}` : item.name;
            
            // Las carpetas en Supabase storage.list() normalmente no tienen id ni metadata
            if (!item.id || !item.metadata) {
                const subFiles = await listAllFiles(bucketName, currentPath);
                files.push(...subFiles);
            } else {
                files.push(currentPath);
            }
        }
        return files;
    }

    const allFiles = await listAllFiles('audios');
    const wavFiles = allFiles.filter(file => file.toLowerCase().endsWith('.wav'));

    console.log(`Found ${wavFiles.length} .wav files in storage to migrate.`);

    let originalTotalSize = 0;
    let newTotalSize = 0;
    let migratedCount = 0;

    for (const oldFilePath of wavFiles) {
        try {
            console.log(`Migrating storage file: ${oldFilePath}`);
            
            const { data: { publicUrl: oldUrl } } = supabase.storage.from('audios').getPublicUrl(oldFilePath);

            // 1. Download WAV
            const response = await fetch(oldUrl);
            if (!response.ok) {
                console.error(`Failed to download ${oldUrl}`);
                continue;
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const originalSize = arrayBuffer.byteLength;
            originalTotalSize += originalSize;

            // 2. Strip WAV header (assuming 44 bytes standard header)
            const pcmData = new Uint8Array(arrayBuffer, 44);
            
            // 3. Encode to MP3
            const mp3Data = encodeToMp3(pcmData);
            const newSize = mp3Data.byteLength;
            newTotalSize += newSize;

            // 4. Determine new filename and path
            const newFilePath = oldFilePath.substring(0, oldFilePath.length - 4) + '.mp3';

            // 5. Upload MP3
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('audios')
                .upload(newFilePath, mp3Data, {
                    contentType: 'audio/mpeg',
                    upsert: true
                });

            if (uploadError) {
                console.error(`Failed to upload MP3: ${uploadError.message}`);
                continue;
            }

            const { data: { publicUrl: newUrl } } = supabase.storage.from('audios').getPublicUrl(newFilePath);

            // 6. Update Database if there's any reference to this old URL
            const { error: updateError } = await supabase
                .from('audio_cache')
                .update({ url: newUrl })
                .eq('url', oldUrl);

            if (updateError) {
                console.error(`Failed to update DB for ${oldUrl}: ${updateError.message}`);
                continue;
            }

            // 7. Delete old WAV
            await supabase.storage.from('audios').remove([oldFilePath]);

            const savedPercent = Math.round(100 - (newSize / originalSize * 100));
            console.log(`✓ Converted: ${originalSize} bytes -> ${newSize} bytes (${savedPercent}% smaller)`);
            migratedCount++;
        } catch (e) {
            console.error(`Error processing file ${oldFilePath}:`, e);
        }
    }

    console.log(`\n=== MIGRATION REPORT ===`);
    console.log(`Files Migrated: ${migratedCount}`);
    
    if (migratedCount > 0) {
        const oMB = (originalTotalSize / 1024 / 1024).toFixed(2);
        const nMB = (newTotalSize / 1024 / 1024).toFixed(2);
        const sMB = ((originalTotalSize - newTotalSize) / 1024 / 1024).toFixed(2);
        const percentage = Math.round(((originalTotalSize - newTotalSize) / originalTotalSize) * 100);
        
        console.log(`Original Audio Size: ${oMB} MB`);
        console.log(`New Audio Size (MP3): ${nMB} MB`);
        console.log(`🏆 Total Space Saved: ${sMB} MB (${percentage}%)`);
    } else {
        console.log(`No WAV files found in storage to migrate.`);
    }
}

migrate();
