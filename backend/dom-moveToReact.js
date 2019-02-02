
//race layout stuff -- replace with react functionality
let entrantDropDown = document.getElementsByClassName("entrantDropDown");

Array.from(entrantDropDown).forEach(element => {
	element.addEventListener("click", e => {
		let entrant = e.target.nextSibling;
		let buttonText = e.target.innerText;
		buttonText = buttonText.substring(0, buttonText.length - 2);
		console.log(buttonText);
		if (entrant.style.display === "block") {
			entrant.style.display = "none";
			e.target.innerText = `${buttonText} ${String.fromCharCode(9660)}`;
		} else {
			entrant.style.display = "block";
			e.target.innerText = `${buttonText} ${String.fromCharCode(9650)}`;
		}
	});
});