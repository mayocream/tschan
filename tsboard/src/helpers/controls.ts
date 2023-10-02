import { Control, Transform, TransformActionHandler } from 'fabric'
import * as fabric from 'fabric'

const {
  scaleCursorStyleHandler,
  scaleSkewCursorStyleHandler,
  scalingXOrSkewingY,
  scalingYOrSkewingX,
  scaleOrSkewActionName,
  scalingEqually,
  rotationWithSnapping,
  rotationStyleHandler,
  getLocalPoint,
  wrapWithFireEvent,
  wrapWithFixedAnchor,
} = fabric.controlsUtils

const CENTER = 'center'
const LEFT = 'left'
const TOP = 'top'
const BOTTOM = 'bottom'
const RIGHT = 'right'
const NONE = 'none'

/**
 * Checks if transform is centered
 * @param {Object} transform transform data
 * @return {Boolean} true if transform is centered
 */
function isTransformCentered(transform: Transform) {
  return transform.originX === CENTER && transform.originY === CENTER
}

/**
 * Action handler to change object's width
 * Needs to be wrapped with `wrapWithFixedAnchor` to be effective
 * @param {Event} eventData javascript event that is doing the transform
 * @param {Object} transform javascript object containing a series of information around the current transform
 * @param {number} x current mouse x position, canvas normalized
 * @param {number} y current mouse y position, canvas normalized
 * @return {Boolean} true if some change happened
 */
const changeObjectWidth: TransformActionHandler = (eventData, transform, x, y) => {
  const localPoint = getLocalPoint(transform, transform.originX, transform.originY, x, y)
  //  make sure the control changes width ONLY from it's side of target
  if (
    transform.originX === CENTER ||
    (transform.originX === RIGHT && localPoint.x < 0) ||
    (transform.originX === LEFT && localPoint.x > 0)
  ) {
    const { target } = transform,
      strokePadding = target.strokeWidth / (target.strokeUniform ? target.scaleX : 1),
      multiplier = isTransformCentered(transform) ? 2 : 1,
      oldWidth = target.width,
      newWidth = Math.ceil(Math.abs((localPoint.x * multiplier) / target.scaleX) - strokePadding)
    target.set('width', Math.max(newWidth, 0))
    //  check against actual target width in case `newWidth` was rejected
    return oldWidth !== target.width
  }
  return false
}

/**
 * Action handler to change object's height
 * Needs to be wrapped with `wrapWithFixedAnchor` to be effective
 * @param {Event} eventData javascript event that is doing the transform
 * @param {Object} transform javascript object containing a series of information around the current transform
 * @param {number} x current mouse x position, canvas normalized
 * @param {number} y current mouse y position, canvas normalized
 * @return {Boolean} true if some change happened
 */
const changeObjectHeight: TransformActionHandler = (eventData, transform, x, y) => {
  const localPoint = getLocalPoint(transform, transform.originX, transform.originY, x, y)
  //  make sure the control changes height ONLY from it's side of target
  if (
    transform.originY === CENTER ||
    (transform.originY === BOTTOM && localPoint.y < 0) ||
    (transform.originY === TOP && localPoint.y > 0)
  ) {
    const { target } = transform,
      strokePadding = target.strokeWidth / (target.strokeUniform ? target.scaleY : 1),
      multiplier = isTransformCentered(transform) ? 2 : 1,
      oldHeight = target.height,
      newHeight = Math.ceil(Math.abs((localPoint.y * multiplier) / target.scaleY) - strokePadding)
    target.set('height', Math.max(newHeight, 0))
    //  check against actual target height in case `newHeight` was rejected
    return oldHeight !== target.height
  }
  return false
}

const changeWidth = wrapWithFireEvent('resizing', wrapWithFixedAnchor(changeObjectWidth))
const changeHeight = wrapWithFireEvent('resizing', wrapWithFixedAnchor(changeObjectHeight))

export const createResizeControls = () => ({
  ml: new Control({
    x: -0.5,
    y: 0,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionHandler: changeWidth,
    actionName: 'resizing',
  }),

  mr: new Control({
    x: 0.5,
    y: 0,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionHandler: changeWidth,
    actionName: 'resizing',
  }),

  mb: new Control({
    x: 0,
    y: 0.5,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionHandler: changeHeight,
    actionName: 'resizing',
  }),

  mt: new Control({
    x: 0,
    y: -0.5,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionHandler: changeHeight,
    actionName: 'resizing',
  }),

  //   tl: new Control({
  //     x: -0.5,
  //     y: -0.5,
  //     cursorStyleHandler: scaleCursorStyleHandler,
  //     actionHandler: scalingEqually,
  //   }),

  //   tr: new Control({
  //     x: 0.5,
  //     y: -0.5,
  //     cursorStyleHandler: scaleCursorStyleHandler,
  //     actionHandler: scalingEqually,
  //   }),

  //   bl: new Control({
  //     x: -0.5,
  //     y: 0.5,
  //     cursorStyleHandler: scaleCursorStyleHandler,
  //     actionHandler: scalingEqually,
  //   }),

  //   br: new Control({
  //     x: 0.5,
  //     y: 0.5,
  //     cursorStyleHandler: scaleCursorStyleHandler,
  //     actionHandler: scalingEqually,
  //   }),

  //   mtr: new Control({
  //     x: 0,
  //     y: -0.5,
  //     actionHandler: rotationWithSnapping,
  //     cursorStyleHandler: rotationStyleHandler,
  //     offsetY: -40,
  //     withConnection: true,
  //     actionName: 'rotate',
  //   }),
})
