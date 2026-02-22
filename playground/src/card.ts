import { t } from "../../src/index";
import { reactive } from "../../src/elements/reactivity";
import { createComponent } from "../../src/elements/createEl";


// counter component
export const Counter = createComponent(() => {
  const state = reactive({ count: 0 });

  return () =>
    t.div(
      {},
      t.h1({}, `${state.count}`),
      t.button(
        { events: { name: "click", handler: () => state.count++ } },
        "+",
      ),
    );
});

export const card = (nums: number) => {
  let number = nums;

  const increment = () => (number += 1);
  // console.log(number);
  return t.div(
    { className: "card" },
    t.text(`Card `),
    t.h2({}, "Header Card"),
    t.div({ className: "card-body" }, t.p({}, `Count : ${number}`)),
    t.button(
      {
        className: "card-btn",
        events: {
          name: "click",
          handler: () => {
            increment();
            // console.log(number);
            // alert("CLIKED")
          },
        },
      },
      t.text("CLICK ME"),
    ),
  );
};
