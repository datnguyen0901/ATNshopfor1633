document.querySelector('.search-btn').addEventListener('click', function () {
	this.parentElement.classList.toggle('open')
	this.previousElementSibling.focus()
})

var number = 1;

function plusOne(count) {
  number++;
  count.textContent = number.toString();
}




