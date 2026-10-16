document.getElementById('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const phone = document.getElementById('phone').value.trim();
  const code = document.getElementById('code').value.trim();
  const messageEl = document.getElementById('message');

  if (!phone || !code) {
    showMessage('Please fill in both fields', 'error');
    return;
  }

  try {
    const res = await fetch('/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem('sessionId', data.sessionId);
      localStorage.setItem('phone', phone);
      showMessage('Verification successful. Starting report process...', 'success');

      // Auto-start the report flood
      setTimeout(async () => {
        const reportRes = await fetch('/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data.sessionId,
            phone
          })
        });

        const reportData = await reportRes.json();
        if (reportData.success) {
          window.location.href = `/status?jobId=${reportData.jobId}`;
        }
      }, 1500);
    } else {
      showMessage(data.error || 'Verification failed', 'error');
    }
  } catch (err) {
    showMessage('Network error. Try again.', 'error');
  }
});

function showMessage(text, type) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.className = `message ${type}`;
  el.classList.remove('hidden');
}
