import { t } from "../../src/index";
import { card } from "./card";
import { Counter } from "./card";

export const home = () => {
  return t.div(
    { className: "container" },
    
    // Header
    t.header(
      { className: "header" },
      t.div(
        { className: "header-content" },
        t.h1({}, "Svaela Framework"),
        t.p({ className: "subtitle" }, "A lightweight, reactive UI framework"),
      ),
    ),
    
    // Navigation
    t.nav(
      { className: "nav" },
      t.ul(
        {},
        t.li({}, t.a({}, "Home")),
        t.li({}, t.a({}, "Docs")),
        t.li({}, t.a({}, "Examples")),
        t.li({}, t.a({}, "About")),
      ),
    ),
    
    // Main Content
    t.main(
      { className: "main-content" },
      // Hero Section
      t.section(
        { className: "hero" },
        t.h2({}, "Welcome to Svaela"),
        t.p(
          {},
          "Build modern web applications with a simple and intuitive component system.",
        ),
        t.button(
          {
            className: "cta-button",
            events: {
              name: "click",
              handler: () => alert("Get started with Svaela!"),
            },
          },
          t.text("Get Started"),
        ),
      ),
      
      // Features Section
      t.section(
        { className: "features" },
        t.h2({ className: "section-title" }, "Features"),
        t.div(
          { className: "features-grid" },
          // Feature Card 1
          t.div(
            { className: "feature-card" },
            t.h3({}, "Simple API"),
            t.p({}, "Easy-to-use builder pattern for creating UI components"),
          ),
          // Feature Card 2
          t.div(
            { className: "feature-card" },
            t.h3({}, "Reactive"),
            t.p({}, "Automatically updates your UI when data changes"),
          ),
          // Feature Card 3
          t.div({ className: "feature-card" },
            t.h3({}, "Lightweight"),
            t.p({}, "Minimal dependencies, fast load times and performance"),
          ),
        ),
      ),
      
      // Examples Section
      t.section({ className: "examples" },
        t.h2({ className: "section-title" }, "Component Examples"),
        t.div({ className: "examples-grid" }, card(1), card(2), card(3)),
      ),
    ),
    
    // Examples Section
    t.section({ className: "examples" },
      t.h2({ className: "section-title" }, "Counter Example 1 "),
      t.div({ className: "examples-grid" }, Counter()),
      t.h2({ className: "section-title" }, "Counter Example 2 "),
      t.div({ className: "examples-grid" }, Counter()),
    ),
    
    // Footer
    t.footer(
      { className: "footer" },
      t.p({}, "© 2026 Svaela Framework. All rights reserved."),
    ),
  );
};
