export interface Element {
    key: string;
    value: string;
}

interface ApprovalParamsResult {
    status: string; //Approved | Rejected
    summary: string;
}

export interface ApprovalParams {
    actionName: string;
    pipelineName: string;
    result: ApprovalParamsResult;
    stageName: string;
    token: string;
}

interface ApprovalMessage {
    approval: ApprovalParams;
}

export interface ProcessApprovalEvent {
    msg: ApprovalMessage;
    filename?: string;
    removeLatestVersion?: boolean;
}
