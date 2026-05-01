FROM public.ecr.aws/lambda/python:3.11
WORKDIR /var/task

COPY libs/common/pyproject.toml /tmp/common/pyproject.toml
COPY libs/common/src /tmp/common/src
RUN pip install --no-cache-dir /tmp/common && rm -rf /tmp/common

COPY services/phishing_ml_predict/pyproject.toml ./pyproject.toml
COPY services/phishing_ml_predict/handler.py ./handler.py
COPY services/phishing_ml_predict/model_artifacts ./model_artifacts
RUN pip install --no-cache-dir .

CMD [ "handler.lambda_handler" ]
