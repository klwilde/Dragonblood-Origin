import './style.css';

document.getElementById('year').textContent = new Date().getFullYear();
const form = document.getElementById('interest-form');
const message = document.getElementById('form-message');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = new FormData(form).get('email');
  message.textContent = `Signal received for ${email}. This is a local interest note for now.`;
  form.reset();
});
