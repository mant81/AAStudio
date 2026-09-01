(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
        return;
    }
    root.DiagramLogic = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const normalizeBox = (start, end) => ({
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y)
    });

    const isBoxInside = (box, area) => box.x >= area.x
        && box.y >= area.y
        && box.x + box.width <= area.x + area.width
        && box.y + box.height <= area.y + area.height;

    const nodeMinimumSize = (nodeKind, shapeType) => {
        if (nodeKind === "group-box") {
            return { width: 240, height: 120 };
        }
        if (nodeKind === "shape") {
            return { width: 40, height: 40 };
        }
        return { width: 120, height: 72 };
    };

    const resizeBox = (startBox, corner, currentPoint, minimumSize, options) => {
        const startRight = startBox.left + startBox.width;
        const startBottom = startBox.top + startBox.height;

        let nextLeft = startBox.left;
        let nextTop = startBox.top;
        let nextWidth = startBox.width;
        let nextHeight = startBox.height;

        if (corner.includes("w")) {
            nextLeft = Math.min(currentPoint.x, startRight - minimumSize.width);
            nextWidth = startRight - nextLeft;
        } else if (corner.includes("e")) {
            nextWidth = Math.max(minimumSize.width, currentPoint.x - startBox.left);
        }

        if (corner.includes("n")) {
            nextTop = Math.min(currentPoint.y, startBottom - minimumSize.height);
            nextHeight = startBottom - nextTop;
        } else if (corner.includes("s")) {
            nextHeight = Math.max(minimumSize.height, currentPoint.y - startBox.top);
        }

        if (options?.preserveAspect && corner.length === 2) {
            const size = Math.max(minimumSize.width, minimumSize.height, nextWidth, nextHeight);
            if (corner.includes("w")) {
                nextLeft = startRight - size;
            }
            if (corner.includes("n")) {
                nextTop = startBottom - size;
            }
            nextWidth = size;
            nextHeight = size;
        }

        return {
            left: nextLeft,
            top: nextTop,
            width: nextWidth,
            height: nextHeight
        };
    };

    const badgeClassName = (position) => {
        const safePosition = ["left", "center", "right"].includes(position) ? position : "right";
        return `diagram-node-badge diagram-node-badge--${safePosition}`;
    };

    return {
        badgeClassName,
        isBoxInside,
        nodeMinimumSize,
        normalizeBox,
        resizeBox
    };
}));
