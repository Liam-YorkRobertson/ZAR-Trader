// Sign-up functionality

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const message = document.getElementById('message');

  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error);
          });
        }
        return response.json();
      })
      .then((data) => {
        message.textContent = data.message;
        message.style.display = 'block';
        signupForm.reset();
        // Hide the message popup
        setTimeout(() => {
          message.style.display = 'none';
        }, 1500);
        // Redirect to sign-in
        setTimeout(() => {
          window.location.href = 'sign-in.html';
        }, 2000);
      })
      .catch((error) => {
        message.textContent = error.message;
        message.style.display = 'block';
        setTimeout(() => {
          message.style.display = 'none';
        }, 1000);
      });
  });
});
