const form = document.getElementsByClassName('accServer')[0];
const formElements = [].slice.call(form.elements);

const validKids = formElements.filter((singleFormElement) => {
	return (singleFormElement.tagName === 'SELECT' || singleFormElement.tagName === 'INPUT');
});

const formToJSON = thingsToGetJSOND => thingsToGetJSOND.reduce((data, aSingleValidKid) => { //reducer function to parce form data
		let value;

		if (aSingleValidKid.type === 'number' || aSingleValidKid.type === 'range') {
			value = aSingleValidKid.valueAsNumber;
		} else if (aSingleValidKid.type === 'radio') {
			value = Number(aSingleValidKid.value);	
		} else {
			value = aSingleValidKid.value; 
		}

		data[aSingleValidKid.name] = value; //add the current field to the object 'data'
	
	return data; //show me that data daddy

}, {});

const sessionParser = (aFormItem, sessions) => {
	const name = aFormItem.name;
	let value = aFormItem.value;
	if (aFormItem.type === 'number') {
		value = aFormItem.valueAsNumber;
	}
	if (aFormItem.classList.contains('practice')){
		sessions.practice[name] = value;
	}
	else if (aFormItem.classList.contains('qualy')){
		sessions.qualy[name] = value;
	}
	else if (aFormItem.classList.contains('race')){
		sessions.race[name] = value;
	}
	
};

const fieldsetSeparator = async () => {
	const fieldsets = document.getElementsByClassName('fieldsets'); //get fieldsets
	const L = fieldsets.length; //how many fieldsets there are

	const data = formToJSON(validKids);
	
	for (let i = 0; i < L; i++) {
		const fieldset = fieldsets[i].id; //use our counter to select specific element of the arrray then get that element's ID
		const aFather = document.getElementById(fieldset); //store the specific fieldset in 'aFather'

		const fieldsetData = {};
		const sessions = {
			practice : {},
			qualy : {},
			race : {},
		}; //holder for hidden .session inputs
		
		for (let c = 0; c < validKids.length; ++c) {
			const aSingleValidKid = validKids[c];
			if  (aSingleValidKid.parentElement === aFather) {
				if (aSingleValidKid.classList.contains('session')){
				
				sessionParser(aSingleValidKid, sessions);
				fieldsetData.sessions = [sessions.practice, sessions.qualy, sessions.race];
				} else {
					fieldsetData[aSingleValidKid.name] = data[aSingleValidKid.name];
				}
			}
		};

		const dataContainer = document.getElementById(fieldset + '_data'); //selects the output display container from the html
		dataContainer.textContent = JSON.stringify(fieldsetData, null, " "); //outputs the JSON string to the display container in the html
	};
};

const handleFormSubmit = event => {
	event.preventDefault(); //stop the form from submitting (we will handle with AJAX)
	fieldsetSeparator();
};
form.addEventListener('submit', handleFormSubmit); //call handleFormSubmit when the 'submit' event happens