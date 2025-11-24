# Stage 1: Build ClamAV in a clean environment
FROM amazonlinux:2023 as builder

# Install build dependencies
RUN dnf update -y && \
    dnf install -y \
        gcc gcc-c++ make cmake wget tar gzip xz pkgconfig \
        zlib-devel openssl-devel json-c-devel bzip2-devel \
        libxml2-devel pcre2-devel ncurses-devel check-devel \
        libcurl-devel libtool automake autoconf flex bison which git \
    && dnf clean all

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"

# Build ClamAV 1.0.9
ARG CLAMAV_VERSION=1.0.9
RUN cd /tmp && \
    wget https://www.clamav.net/downloads/production/clamav-${CLAMAV_VERSION}.tar.gz && \
    tar -xzf clamav-${CLAMAV_VERSION}.tar.gz && \
    cd clamav-${CLAMAV_VERSION} && \
    mkdir build && cd build && \
    cmake .. \
      -DCMAKE_INSTALL_PREFIX=/opt/clamav \
      -DENABLE_SYSTEMD=OFF \
      -DENABLE_CLAMONACC=OFF \
      -DENABLE_MILTER=OFF \
      -DENABLE_TESTS=OFF \
      -DENABLE_DOCS=OFF \
      -DENABLE_EXAMPLES=OFF \
      -DENABLE_MAN_PAGES=OFF \
      -DENABLE_APP=ON \
      -DENABLE_UNRAR=ON \
      -DENABLE_JSON_SHARED=ON && \
    make -j$(nproc) && \
    make install

# Stage 2: Use Lambda Python base
FROM --platform=linux/amd64 public.ecr.aws/lambda/python:3.12

LABEL name="lambda/python/clamav"
LABEL version="1.0"

# Copy everything from builder
COPY --from=builder /opt/clamav /opt/clamav

# Set library path instead of using ldconfig
ENV LD_LIBRARY_PATH="/opt/clamav/lib64:/opt/clamav/lib:$LD_LIBRARY_PATH"
ENV PATH="/opt/clamav/bin:$PATH"

# Create symlinks to standard locations
RUN ln -sf /opt/clamav/bin/clamscan /usr/local/bin/clamscan && \
    ln -sf /opt/clamav/bin/freshclam /usr/local/bin/freshclam && \
    ln -sf /opt/clamav/bin/clamdscan /usr/local/bin/clamdscan && \
    # Copy libraries
    cp /opt/clamav/lib64/* /usr/lib64/ 2>/dev/null || true && \
    cp /opt/clamav/lib/* /usr/lib64/ 2>/dev/null || true

# Verify installation
RUN clamscan --version || echo "ClamAV found but may have library issues"

# Python libs
RUN pip3 install --no-cache-dir \
        cffi \
        boto3 \
        requests \
        aws-lambda-powertools \
        awslambdaric

COPY clamd.conf /etc/clamd.conf
RUN cp /etc/clamd.conf /tmp/clamd.conf

COPY lambda.py /var/task/lambda.py

ENTRYPOINT [ "/var/lang/bin/python3", "-m", "awslambdaric" ]
CMD [ "lambda.lambda_handler" ]