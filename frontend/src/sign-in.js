/* eslint-env browser */

document.addEventListener('DOMContentLoaded', () => {
  const signInForm = document.getElementById('signin-form');
  signInForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(signInForm);
    const usernameOrEmail = formData.get('usernameOrEmail');
    const password = formData.get('password');
    if (!usernameOrEmail || !password) {
      alert('Please enter both username/email and password.');
      return;
    }

    try {
      const response = await fetch('/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail,
          password,
        }),
      });

      if (response.ok) {
        window.location.href = 'homepage.html';
      } else {
        const data = await response.json();
        if (data && data.error) {
          alert(data.error);
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
      alert('An error occurred while signing in. Please try again later.');
    }
  });
});
