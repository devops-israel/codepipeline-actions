import { uploadFileToSlack } from './controller';
exports.handler = async (event: any, _context: any, _callback: any) => {
  try {
    const response = await uploadFileToSlack(event);
    console.log(response);
    return response;
  } catch (err) {
    console.log(err);
    return err;
  }
};
