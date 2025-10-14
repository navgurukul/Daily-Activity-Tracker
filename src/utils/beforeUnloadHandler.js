// Before unload event handler
export const handleBeforeUnload = (event) => {
  event.preventDefault();
  event.returnValue = true;
};