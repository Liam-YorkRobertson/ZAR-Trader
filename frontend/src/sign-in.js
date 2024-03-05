// Sign-in functionality

document.addEventListener('DOMContentLoaded', () => {
  const signInForm = document.getElementById('signin-form');
  const errorMessage = document.getElementById('error-message');

  signInForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(signInForm);
    const usernameOrEmail = formData.get('usernameOrEmail');
    const password = formData.get('password');
    if (!usernameOrEmail || !password) {
      displayErrorMessage('Please enter both username/email and password.');
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
        const data = await response.json();
        console.log('Response from server:', data);
        if (data && data.email) {
          localStorage.setItem('userEmail', data.email);
          console.log('Email saved in localStorage:', data.email);
        }
        window.location.href = 'homepage.html';
      } else {
        const data = await response.json();
        console.log('Error response from server:', data);
        if (data && data.error) {
          displayErrorMessage(data.error);
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
      displayErrorMessage('An error occurred while signing in. Please try again later.');
    }
  });

  function displayErrorMessage(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 1500);
  }
});
