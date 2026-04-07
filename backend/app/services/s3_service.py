import boto3
import os
from typing import Optional
from botocore.exceptions import ClientError
from app.core.config import settings

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'ap-south-1')
        )
        self.bucket_name = os.getenv('AWS_S3_BUCKET_NAME', 'kisangpttt')

    async def upload_file(self, file_content: bytes, file_name: str, folder: str = "disease_images") -> Optional[str]:
        """
        Uploads a file to S3 and returns the public URL.
        """
        try:
            key = f"{folder}/{file_name}"
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_content,
                ContentType='image/jpeg' # Adjust based on file type if needed
            )
            
            # Construct the public URL
            url = f"https://{self.bucket_name}.s3.{os.getenv('AWS_REGION', 'ap-south-1')}.amazonaws.com/{key}"
            return url
        except ClientError as e:
            print(f"Error uploading file to S3: {e}")
            return None

s3_service = S3Service()
