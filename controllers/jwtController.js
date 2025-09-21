import jwt from "jsonwebtoken";
import User from "../../models/User";
import createError from "http-errors";

export async function loginJWT(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    // if not user or password doesnt match----->error
    if (!user || !(await user.comparePassword(password))) {
      next(createError(401, "invalid credentials"));
      return;
    }

    //if user exists  and password does match---->create token
    jwt.sign(
      { user_id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "2d",
      },
      (err, tokenJWT) => {
        if (err) {
          return next(err);
        }
        res.json({ tokenJWT });
      }
    );
  } catch (error) {
    next(error);
  }
}
