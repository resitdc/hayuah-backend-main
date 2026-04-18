import { Request } from "express";
// import { UploadedFile } from "express-fileupload";
// import AWS from "aws-sdk";

declare global {
  var s3Bucket: string;
  var s3PublicUrl: string;
  // var s3: AWS.S3;
}
