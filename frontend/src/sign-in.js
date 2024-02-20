/* eslint-env browser */

document.addEventListener('DOMContentLoaded', () => {
  const signInForm = document.getElementById('signin-form');

  signInForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(signInForm);

    fetch('/signin', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = '/homepage.html';
        } else {
          return response.json();
        }
      })
      .then((data) => {
        if (data && data.error) {
          alert(data.error);
        }
      })
      .catch((error) => {
        console.error('Error signing in:', error);
        alert('An error occurred while signing in. Please try again later.');
      });
  });
});
