import Tags from "../tags.js";
import test from "ava";

let form = document.createElement("form");
// Make our form available to jsdom
document.body.appendChild(form);

let holder = document.createElement("div");
let el = document.createElement("select");
el.setAttribute("placeholder", "Test placeholder");
el.setAttribute("multiple", "multiple");
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
form.appendChild(maxHolder);

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

  t.truthy(regularTags.canAdd("addfirst"));
  regularTags.addItem("addfirst")
  t.falsy(regularTags.canAdd("addfirst"));
  t.falsy(regularTags.canAdd(""));

  t.falsy(disabledTags.canAdd("test"));

  // Let's add one then test
  t.truthy(maxTags.canAdd("test"));
  maxTags.addItem("test");
  t.falsy(maxTags.canAdd("test"));
});
