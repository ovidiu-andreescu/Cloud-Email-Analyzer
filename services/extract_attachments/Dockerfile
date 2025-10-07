FROM public.ecr.aws/lambda/python:3.11
WORKDIR /var/task

COPY libs/common/pyproject.toml /tmp/common/pyproject.toml
COPY libs/common/src /tmp/common/src
RUN pip install --no-cache-dir /tmp/common && rm -rf /tmp/common

COPY services/extract_attachments/pyproject.toml ./pyproject.toml

RUN pip install --no-cache-dir . /tmp/common && \
    rm -rf /tmp/common

COPY services/extract_attachments/src .

CMD [ "extract_attachments.main.handler" ]