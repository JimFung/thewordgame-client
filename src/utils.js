/**
  Clamp will return a function that is bound between whichever 2 numbers you created the clamp function with, inclusively.
  For example, calling clamp with (1,10) will return a function that accepts a number and will return either 1, 10, or the number.

  I wrote clamp this way so that I can generate a function that will always deterministically clamp between 2 numbers, instead of having to pass those 2 numbers in every time i use clamp.

  Yes, I should checked if the value is a number first. 
*/
export const clamp = (min, max) => value => {
  if(value < min) {
    return min
  }
  if(value > max) {
    return max
  }
  return value
}
