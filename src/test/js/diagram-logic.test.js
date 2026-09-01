const assert = require("node:assert/strict");
const test = require("node:test");
const logic = require("../../main/resources/static/js/diagram-logic.js");

test("normalizeBox keeps positive size regardless of drag direction", () => {
    assert.deepEqual(
        logic.normalizeBox({ x: 200, y: 160 }, { x: 120, y: 90 }),
        { x: 120, y: 90, width: 80, height: 70 }
    );
});

test("isBoxInside requires the whole node box to be inside selection", () => {
    const selection = { x: 100, y: 100, width: 300, height: 200 };
    assert.equal(logic.isBoxInside({ x: 120, y: 130, width: 80, height: 60 }, selection), true);
    assert.equal(logic.isBoxInside({ x: 80, y: 130, width: 80, height: 60 }, selection), false);
    assert.equal(logic.isBoxInside({ x: 350, y: 130, width: 80, height: 60 }, selection), false);
});

test("resizeBox supports edge resizing with minimum dimensions", () => {
    const startBox = { left: 100, top: 100, width: 160, height: 120 };
    assert.deepEqual(
        logic.resizeBox(startBox, "w", { x: 230, y: 120 }, { width: 80, height: 60 }),
        { left: 180, top: 100, width: 80, height: 120 }
    );
    assert.deepEqual(
        logic.resizeBox(startBox, "s", { x: 120, y: 145 }, { width: 80, height: 60 }),
        { left: 100, top: 100, width: 160, height: 60 }
    );
});

test("resizeBox preserves circle aspect ratio from corner handles only", () => {
    const startBox = { left: 100, top: 100, width: 120, height: 120 };
    assert.deepEqual(
        logic.resizeBox(startBox, "nw", { x: 60, y: 90 }, { width: 40, height: 40 }, { preserveAspect: true }),
        { left: 60, top: 60, width: 160, height: 160 }
    );
    assert.deepEqual(
        logic.resizeBox(startBox, "e", { x: 260, y: 100 }, { width: 40, height: 40 }, { preserveAspect: true }),
        { left: 100, top: 100, width: 160, height: 120 }
    );
});

test("badgeClassName falls back to right for invalid values", () => {
    assert.equal(logic.badgeClassName("left"), "diagram-node-badge diagram-node-badge--left");
    assert.equal(logic.badgeClassName("center"), "diagram-node-badge diagram-node-badge--center");
    assert.equal(logic.badgeClassName("broken"), "diagram-node-badge diagram-node-badge--right");
});
