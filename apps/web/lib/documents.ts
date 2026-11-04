/**
 * Opens an authenticated HTML document (e.g. the GST invoice) in a new tab. The tab is
 * opened synchronously so pop-up blockers allow it, then filled once the document arrives.
 */
export async function openDocument(load: () => Promise<string>) {
  const tab = window.open('', '_blank');
  try {
    const html = await load();
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    if (tab) tab.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    tab?.close();
    window.alert(e instanceof Error ? e.message : 'Couldn’t open the invoice. Please try again.');
  }
}
