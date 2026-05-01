FROM public.ecr.aws/lambda/python:3.12

LABEL name="lambda/python/clamav"
LABEL version="1.0"

WORKDIR ${LAMBDA_TASK_ROOT}

# LocalStack Pro and AWS image modes use a real ClamAV binary. The packaged
# signature data keeps local demo builds deterministic; production can replace
# this with a scheduled freshclam/update pipeline backed by shared storage.
RUN dnf install -y \
        clamav1.5 \
        clamav1.5-data \
        clamav1.5-freshclam \
    && dnf clean all \
    && clamscan --version

ENV CLAMAV_DB_DIR="/var/lib/clamav"

RUN pip3 install --no-cache-dir \
        boto3 \
        requests \
        aws-lambda-powertools \
        awslambdaric

COPY libs/common/pyproject.toml /tmp/common/pyproject.toml
COPY libs/common/src /tmp/common/src
RUN pip3 install --no-cache-dir /tmp/common && rm -rf /tmp/common

COPY services/clamav_virus_scan/clamd.conf /etc/clamd.conf
RUN cp /etc/clamd.conf /tmp/clamd.conf

COPY services/clamav_virus_scan/lambda.py ${LAMBDA_TASK_ROOT}/lambda.py

ENTRYPOINT [ "/var/lang/bin/python3", "-m", "awslambdaric" ]
CMD [ "lambda.lambda_handler" ]
