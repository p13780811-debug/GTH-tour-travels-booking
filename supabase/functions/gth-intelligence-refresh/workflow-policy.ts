const REPOSITORY="p13780811-debug/GTH-tour-travels-booking";
export const REFRESH_AUDIENCE="gth-intelligence-refresh:dqprqjmhxjnrllczqyhz";
export function trustedRefreshWorkflow(payload:Record<string,unknown>):boolean {
 return payload.repository===REPOSITORY && String(payload.repository_id)==="1169920747" &&
  payload.ref==="refs/heads/main" && payload.sub==="repo:"+REPOSITORY+":ref:refs/heads/main" &&
  payload.workflow_ref===REPOSITORY+"/.github/workflows/gth-intelligence-refresh.yml@refs/heads/main" &&
  ["schedule","push","workflow_dispatch"].includes(String(payload.event_name));
}

