use hdk::prelude::*;

#[hdk_extern]
pub fn hello(_: ()) -> ExternResult<String> {
    Ok("Hello from Consciousness Network!".to_string())
}

#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}