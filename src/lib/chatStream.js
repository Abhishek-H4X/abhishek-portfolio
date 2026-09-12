// Handles chunk boundaries and refuses to silently accept unfinished replies.
export async function readChatStream(response, onEvent) {
  if (!response.body) throw new Error("No response stream was received.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let complete = false;
  function processFrames() {
    let separator;
    while ((separator = /\r?\n\r?\n/.exec(buffer))) {
      const frame = buffer.slice(0, separator.index);
      buffer = buffer.slice(separator.index + separator[0].length);
      let event = "message";
      const data = [];
      for (const line of frame.split(/\r?\n/)) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      if (!data.length) continue;
      let payload;
      try { payload = JSON.parse(data.join("\n")); }
      catch { throw new Error("An invalid response was received. Please try again."); }
      if (event === "error") throw new Error(payload.message || "The reply failed.");
      if (event === "token" && typeof payload.text !== "string") throw new Error("Invalid reply text.");
      onEvent(event, payload);
      if (event === "done") { complete = true; return; }
    }
  }
  try {
    while (!complete) {
      const { done, value } = await reader.read();
      if (done) { buffer += decoder.decode(); processFrames(); break; }
      buffer += decoder.decode(value, { stream: true });
      processFrames();
    }
    if (!complete) throw new Error("The reply was interrupted. Please try again.");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
