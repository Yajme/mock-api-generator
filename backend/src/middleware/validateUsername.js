//src/middleware/validateUser 
export const validateUsername = async (req,res,next) =>{
  try {
    const {username} = req.params;

  } catch (error) {
   next(error); 
  }
}

export const validateUserId = async () => {
  try {
    const {user_id} = req.params;
  } catch (error) {
   next(error); 
  }
}
