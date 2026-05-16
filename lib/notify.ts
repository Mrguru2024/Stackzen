export async function notifyOnCronFailure(scriptName: string, error: Error | string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[notifyOnCronFailure] SLACK_WEBHOOK_URL not set. Skipping notification.');
    return;
  }
  const message = {
    text: `🚨 *Cron Failure* in \
*${scriptName}*\n\n*Error:* ${typeof error === 'string' ? error : error.message}\n*Time:* ${new Date().toISOString()}`,
  };
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.error('[notifyOnCronFailure] Failed to send Slack notification:', err);
  }
}
