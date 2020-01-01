import { sendSlack } from './controller';
exports.handler = async (event: any, _context: any, _callback: any) => {
  try {
    const response = await sendSlack(event);
    console.log(response);
    return response;
  } catch (err) {
    console.log(err);
    return err;
  }
};
