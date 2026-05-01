import { supabase } from './supabase/client';

interface BugReportParams {
  description: string;
  language: string;
  userEmail?: string;
}

interface AutoErrorParams {
  error: Error;
  componentStack?: string;
  userEmail?: string;
  language?: string;
}

const buildContext = (extra?: Record<string, string>): string => {
  const parts: string[] = [
    `url: ${window.location.href}`,
    `agent: ${navigator.userAgent}`,
  ];
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => parts.push(`${k}: ${v}`));
  }
  return parts.join('\n');
};

export const submitBugReport = async ({ description, language, userEmail }: BugReportParams): Promise<void> => {
  const { error } = await supabase.from('error_logs').insert({
    error_message: description,
    context: buildContext(),
    user_email: userEmail || 'anonymous',
    language,
    url: window.location.href,
  });

  if (error) throw new Error(error.message);
};

export const logAutoError = async ({ error, componentStack, userEmail, language }: AutoErrorParams): Promise<void> => {
  const contextParts: Record<string, string> = {};
  if (componentStack) contextParts['component_stack'] = componentStack.trim().slice(0, 2000);
  if (error.stack) contextParts['js_stack'] = error.stack.split('\n').slice(0, 8).join('\n');

  await supabase.from('error_logs').insert({
    error_message: `[AUTO] ${error.message || 'Unknown error'}`,
    context: buildContext(contextParts),
    user_email: userEmail || 'anonymous',
    language: language || 'unknown',
    url: window.location.href,
  });
};
