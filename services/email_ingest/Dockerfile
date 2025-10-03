FROM public.ecr.aws/lambda/python:3.11

WORKDIR /var/task

COPY libs/common/pyproject.toml /tmp/common/pyproject.toml
COPY libs/common/services_common /tmp/common/services_common/

COPY services/email_normalizer/pyproject.toml ./pyproject.toml

RUN pip install --no-cache-dir . /tmp/common && \
    rm -rf /tmp/common

COPY services/email_normalizer/src .

CMD [ "email_normalizer.handler.handler" ]