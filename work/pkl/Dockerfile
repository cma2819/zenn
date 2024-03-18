FROM oraclelinux:8-slim

RUN curl -L -o pkl https://github.com/apple/pkl/releases/download/0.25.2/pkl-linux-amd64
RUN chmod +x pkl

COPY ./src ./src

ENTRYPOINT [ "./pkl" ]