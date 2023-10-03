import Tags from "../tags.js";
import test from "ava";

let form = document.createElement("form");
// Make our form available to jsdom
document.body.appendChild(form);

let holder = document.createElement("div");
let el = document.createElement("select");
el.setAttribute("placeholder", "Test placeholder");
el.setAttribute("multiple", "multiple");
el.dataset.allowNew = "true";

// let opt = document.createElement("option");
// opt.value = "addfirst";
// opt.innerText = "add first";
// el.appendChild(opt);

holder.appendChild(el);
form.appendChild(holder);

let singleHolder = document.createElement("div");
let singleEl = document.createElement("select");
singleHolder.appendChild(singleEl);
form.appendChild(singleHolder);

let disabledHolder = document.createElement("div");
let disabledEl = document.createElement("select");
disabledEl.setAttribute("disabled", true);
disabledHolder.appendChild(disabledEl);
form.appendChild(disabledHolder);

let maxHolder = document.createElement("div");
let maxEl = document.createElement("select");
maxEl.setAttribute("data-max", 1);
maxHolder.appendChild(maxEl);

let opt = document.createElement("option");
opt.value = "";
opt.innerText = "Pick something";
maxEl.appendChild(opt);
let optTest = document.createElement("option");
optTest.value = "test";
optTest.innerText = "test";
maxEl.appendChild(optTest);
form.appendChild(maxHolder);

let optGroupHolder = document.createElement("div");
let optGroup = document.createElement("select");
optGroupHolder.appendChild(optGroup);
let optGroupTest = document.createElement("optgroup");
optGroupTest.label = "Test group";
optGroup.appendChild(optGroupTest);
let optGroupTestValue = document.createElement("option");
optGroupTestValue.value = "test";
optGroupTestValue.innerText = "test";
optGroupTest.appendChild(optGroupTestValue);
form.appendChild(optGroupHolder);

// Somehow new Event syntax is not working
Event = window.Event;

test("it can create", (t) => {
  let inst = new Tags(el);
  t.is(inst.constructor.name, "Tags");
});
test("it can use init", (t) => {
  Tags.init("select");
  let inst = Tags.getInstance(singleEl);
  t.is(inst.constructor.name, "Tags");
});
test("it has a placeholder", (t) => {
  let singleContent = singleHolder.innerHTML;
  let content = holder.innerHTML;
  t.assert(singleContent.includes('placeholder=""'));
  t.assert(content.includes('placeholder="Test placeholder"'));
});
test("it can be disabled", (t) => {
  let disabledTags = Tags.getInstance(disabledEl);
  let regularTags = Tags.getInstance(el);
  t.truthy(disabledTags.isDisabled());
  t.falsy(regularTags.isDisabled());
});
test("it detects single", (t) => {
  let singleTags = Tags.getInstance(singleEl);
  let multipleTags = Tags.getInstance(el);
  t.truthy(singleTags.isSingle());
  t.falsy(multipleTags.isSingle());
});
test("it can add and remove items", (t) => {
  let tags = Tags.getInstance(el);
  let c = tags.getSelectedValues().length;

  tags.addItem("test");
  t.is(c + 1, tags.getSelectedValues().length);

  tags.removeItem("test");
  t.is(c, tags.getSelectedValues().length);
});
test("it prevents adding if necessary", (t) => {
  let disabledTags = Tags.getInstance(disabledEl);
  let maxTags = Tags.getInstance(maxEl);
  let regularTags = Tags.getInstance(el);

  t.truthy(regularTags.canAdd("addfirst", { new: 1 }));
  t.falsy(regularTags.canAdd("addfirst")); // this option doesn't exit
  let addfirst = regularTags.addItem("addfirst"); // it can be added nonetheless using addItem
  t.falsy(regularTags.canAdd("addfirst")); // the option exists and is selected
  t.falsy(regularTags.canAdd("addfirst", { new: 1 }));
  t.falsy(regularTags.canAdd(""));

  regularTags.setConfig("allowSame", true);
  regularTags.resetSuggestions();
  t.truthy(regularTags.canAdd("addfirst"));
  regularTags.setConfig("allowSame", false);

  t.falsy(disabledTags.canAdd("test"));

  // Let's add one then test
  t.truthy(maxTags.canAdd("test"));
  maxTags.addItem("test");
  t.falsy(maxTags.canAdd("test"));
});
test("has items works", (t) => {
  let optGroupTags = Tags.getInstance(optGroup);
  const data = optGroupTags.getData();
  t.truthy(data.length > 0);
  t.truthy(optGroupTags.hasItem("test"));
  t.falsy(optGroupTags.hasItem("test2"));
});
test("it doesn't contain debug log", (t) => {
  let count = (Tags.toString().match(/console\.log/g) || []).length;
  t.is(count, 0, "The dev should pay more attention");
});
