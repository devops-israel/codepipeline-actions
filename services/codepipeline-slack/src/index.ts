import { processApproval, SnsEvent } from './controller';
exports.handler = async (event: SnsEvent, _context: any, _callback: any) => {
    try {
        const response = await processApproval(event);
        console.log(response);
        return response;
    } catch (err) {
        console.log(err);
        return err;
    }
};
