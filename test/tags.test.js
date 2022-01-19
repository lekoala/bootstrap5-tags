import Tags from "../tags.js";
import test from "ava";

let form = document.createElement("form");

let holder = document.createElement("div");
let el = document.createElement("select");
holder.appendChild(el);

let holder2 = document.createElement("div");
let el2 = document.createElement("select");
el2.setAttribute("placeholder", "Test placeholder");
el2.setAttribute("multiple", "multiple");
holder2.appendChild(el2);

let disabledHolder = document.createElement("div");
let disabledEl = document.createElement("select");
disabledEl.setAttribute("disabled", true);
disabledHolder.appendChild(disabledEl);

form.appendChild(holder);
form.appendChild(holder2);
form.appendChild(disabledHolder);

// This is a very crude mock
document.querySelectorAll = function () {
  return [el, el2, disabledEl];
};

test("it can create", (t) => {
  let inst = new Tags(el);
  t.is(inst.constructor.name, "Tags");
});
test("it can use init", (t) => {
  Tags.init("select");
  let inst = Tags.getInstance(el2);
  t.is(inst.constructor.name, "Tags");
});
test("it has a placeholder", (t) => {
  let content = holder.innerHTML;
  let content2 = holder2.innerHTML;
  t.assert(content.includes('placeholder=""'));
  t.assert(content2.includes('placeholder="Test placeholder"'));
});
test("it can be disabled", (t) => {
  let disabledTags = Tags.getInstance(disabledEl);
  let regularTags = Tags.getInstance(el);
  t.truthy(disabledTags.isDisabled());
  t.falsy(regularTags.isDisabled());
});
