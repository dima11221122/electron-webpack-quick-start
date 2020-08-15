var s3 = require('s3-node-client');
var process = require('process');
var path = require('path');
var fs = require('fs');

var accessKeyId = process.env['AWS_ACCESS_KEY_ID'];
var accessKeySecret = process.env['AWS_SECRET_ACCESS_KEY'];

var client = s3.createClient({
  s3Options: {
    accessKeyId: accessKeyId,
    secretAccessKey: accessKeySecret,
    region: "us-east-1"
  },
});

const WIN_EXTENSION = 'exe';
const LINUX_EXTENSION = 'AppImage';
const MAC_EXTENSION = 'dmg';

const files = fs.readdirSync(path.resolve('./release'));
const localFile = "release/";
const destDir = process.env['DESTINATION_DIRECTORY'] ? process.env['DESTINATION_DIRECTORY'] + '/' : '';
const uploadWithParams = (extension, bucket) => {
  return new Promise((resolve, reject) => {
    const installer = files.filter(file => file.match(new RegExp(`^TestMace.*\\.${extension}$`)));
    if (installer && installer.length > 0) {
      var params = {
        localFile,
        s3Params: {
          Bucket: bucket,
          Key: "some/remote/file",
          // other options supported by putObject, except Body and ContentLength.
          // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
        },
      };
      params.localFile = path.resolve('./release/', installer[0]);
      params.s3Params.Key = destDir + 'TestMace.'+extension;
      var uploader = client.uploadFile(params);
      uploader.on('error', function(err) {
        console.error(`unable to upload in ${bucket}`, err.stack);
        reject();
      });
      uploader.on('end', function() {
        console.log("done uploading in ", bucket);
        resolve();
      });
    } else {
      resolve();
    }
  });
};

const bucket = process.env['S3_BUCKET'] || 'download.testmace.com';

uploadWithParams(WIN_EXTENSION, bucket).then(() => uploadWithParams(LINUX_EXTENSION, bucket)).then(() => uploadWithParams(MAC_EXTENSION, bucket)).catch(() => process.exit(1));
