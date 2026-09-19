# M31 networking security review

## Verified issues fixed

- Authentication now rejects non-active accounts. Previously a valid token for an
  inactive, suspended, or deleted account could access protected networking
  routes; only sending a connection request performed its own active-account
  check.
- Connection request responses now use an atomic, pending-state
  `findOneAndUpdate`. This prevents competing accept, reject, or cancel
  operations from overwriting an already-completed state.
- Active connection requests now have a partial unique compound index on
  `requester` and `recipient`. The service maps a duplicate-key race to the
  existing safe `409` response. Rejected and cancelled requests are outside the
  partial index, so a later request remains allowed.

## Verified protections

- All networking routes apply authentication and controllers use `req.user._id`,
  never a client-supplied actor identity.
- Request response actions verify their authorized participant; removal verifies
  either accepted-connection participant; follow and unfollow are scoped to the
  authenticated follower.
- Networking list, mutual, and suggestion responses project only safe profile
  fields. User password and refresh-token fields are excluded by default and
  are not returned by networking service responses.
- Joi validates IDs and pagination before controllers run. Pagination is bounded
  to 1–50 and networking query filters are constructed from validated scalar
  values rather than client-supplied MongoDB operators.

## Remaining limitations / future work

- The directional unique index cannot prevent two users from sending opposite
  direction requests at exactly the same instant. Solving that requires a
  canonical participant-pair field plus a data migration, which is outside M31.
- Production deployment must build the new MongoDB index and resolve any
  pre-existing active directional duplicates before index creation succeeds.
- Database-backed concurrency tests need an isolated MongoDB test deployment;
  this repository currently has no test database configuration or helper.
