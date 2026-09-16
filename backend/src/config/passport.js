import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User } from "../models/User.model.js";

// Shared logic: find existing user by providerId OR email, or create a new one.
// This is the function both strategies call , keeps the linking logic in one place.
const findOrCreateOAuthUser = async ({ provider, providerId, email, firstName, lastName, avatar }) => {

  //  Already linked to this exact OAuth account before? Just log them in.
  let user = await User.findOne({ provider, providerId });
  if (user) return user;

  //    Same email already exists (registered locally, or via a different provider)?
  //    Link this OAuth method to that SAME account ,  never create a duplicate.
  user = await User.findOne({ email });
  if (user) {
    user.provider = provider;
    user.providerId = providerId;
    user.isEmailVerified = true; // OAuth-verified emails are trusted
    await user.save();
    return user;
  }

  //  Brand new user , create the account
  user = await User.create({
    firstName,
    lastName,
    username: `${firstName}${Math.floor(Math.random() * 10000)}`.toLowerCase(),
    email,
    provider,
    providerId,
    role: "student", // default role for OAuth signups can be changed later in profile settings
    isEmailVerified: true, // OAuth providers already verify email ownership
    avatar,
  });

  return user;
};

//  GOOGLE STRATEGY 
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateOAuthUser({
          provider: "google",
          providerId: profile.id,
          email: profile.emails[0].value,
          firstName: profile.name.givenName || profile.displayName,
          lastName: profile.name.familyName || "",
          avatar: profile.photos?.[0]?.value,
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

//  GITHUB STRATEGY 
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"], // GitHub doesn't always return email by default
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // GitHub's email can be private , profile.emails may be empty
        const email =
          profile.emails?.[0]?.value || `${profile.username}@users.noreply.github.com`;

        const [firstName, ...rest] = (profile.displayName || profile.username).split(" ");

        const user = await findOrCreateOAuthUser({
          provider: "github",
          providerId: profile.id,
          email,
          firstName: firstName || profile.username,
          lastName: rest.join(" ") || "",
          avatar: profile.photos?.[0]?.value,
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;