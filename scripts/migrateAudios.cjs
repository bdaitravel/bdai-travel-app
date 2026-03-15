const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const vm = require('vm');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Load lamejs outside strict mode
const lamejsPath = require.resolve('lamejs/lame.all.js');
const lamejsCode = fs.readFileSync(lamejsPath, 'utf8');
const script = new vm.Script(lamejsCode);
const sandbox = { window: {}, Uint8Array, Int16Array, Int8Array, Math, console, Float32Array };
sandbox.global = sandbox;
vm.createContext(sandbox);
script.runInContext(sandbox);
const lamejs = sandbox.window.lamejs || sandbox.lamejs;

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

if (!lamejs) {
    console.error("Failed to load lamejs in VM!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const encodeToMp3 = (pcmData, sampleRate = 24000) => {
    const int16Data = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2);
    // Explicitly use the attached encoder from our sandbox
    const encoder = new lamejs.Mp3Encoder(1, sampleRate, 64);
    
    const maxSamples = 1152;
    const mp3Data = [];
    
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
    console.log('Fetching audio_cache records...');
    const { data: records, error } = await supabase.from('audio_cache').select('*');
    if (error || !records) {
        console.error('Error fetching records:', error);
        return;
    }

    let originalTotalSize = 0;
    let newTotalSize = 0;
    let migratedCount = 0;
    
    console.log(`Found ${records.length} records in audio_cache.`);

    for (const record of records) {
        if (!record.audio_url || !record.audio_url.endsWith('.wav')) {
            continue;
        }

        try {
            console.log(`Migrating: ${record.language} / ${record.city}`);
            
            // 1. Download WAV
            const response = await fetch(record.audio_url);
            if (!response.ok) {
                console.error(`Failed to download ${record.audio_url}`);
                continue;
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const originalSize = arrayBuffer.byteLength;
            originalTotalSize += originalSize;

            // 2. Strip WAV header
            const pcmData = new Uint8Array(arrayBuffer, 44);
            
            // 3. Encode to MP3
            const mp3Data = encodeToMp3(pcmData);
            const newSize = mp3Data.byteLength;
            newTotalSize += newSize;

            // 4. Determine new filename
            const urlObj = new URL(record.audio_url);
            const pathParts = urlObj.pathname.split('/audios/');
            if (pathParts.length < 2) continue;
            
            const oldFilePath = decodeURIComponent(pathParts[1]);
            const newFilePath = oldFilePath.replace('.wav', '.mp3');

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

            const { data: { publicUrl } } = supabase.storage.from('audios').getPublicUrl(newFilePath);

            // 6. Update Database
            const { error: updateError } = await supabase
                .from('audio_cache')
                .update({ audio_url: publicUrl })
                .eq('text_hash', record.text_hash)
                .eq('language', record.language);

            if (updateError) {
                console.error(`Failed to update DB: ${updateError.message}`);
                continue;
            }

            // 7. Delete old WAV
            await supabase.storage.from('audios').remove([oldFilePath]);

            const savedPercent = Math.round(100 - (newSize / originalSize * 100));
            console.log(`✓ Converted: ${originalSize} bytes -> ${newSize} bytes (${savedPercent}% smaller)`);
            migratedCount++;
        } catch (e) {
            console.error(`Error processing record ${record.id}:`, e.message);
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
        console.log(`No WAV files found to migrate.`);
    }
}

migrate();
