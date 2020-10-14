FROM alpine:3.12

# RUN mkdir -p /worker
#
# WORKDIR /worker
#
# # install node on alpine
# # adapted from https://github.com/alpine-docker/node/blob/master/Dockerfile
#
# # pin params
# ENV VERSION=v14.13.1 NPM_VERSION=6.14.8
# # For base builds
# ENV CONFIG_FLAGS="--fully-static" DEL_PKGS="libstdc++" RM_DIRS=/usr/include
#
# # linux deps
# RUN apk add --no-cache curl gnupg python3 gcc make libstdc++ g++ binutils-gold linux-headers
#
# # node dev pub keys
# RUN for server in ipv4.pool.sks-keyservers.net keyserver.pgp.com ha.pool.sks-keyservers.net; \
# do \
#  gpg --keyserver $server --recv-keys \
#   4ED778F539E3634C779C87C6D7062848A1AB005C \
#   94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
#   FD3A5288F042B6850C66B31F09FE44734EB7990E \
#   71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
#   DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
#   C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
#   B9AE9905FFD7803F25714661B63B535A4C206CA9 \
#   56730D5401028683275BD23C23EFEFE93C4CFFFE \
#   77984A986EBC2AA786BC0F66B01FBB92821C587A && break; \
# done
#
# # fetch node tarball
# RUN curl -sfSLO https://nodejs.org/dist/${VERSION}/node-${VERSION}.tar.xz
#
# # verify node tarball
# RUN curl -sfSL https://nodejs.org/dist/${VERSION}/SHASUMS256.txt.asc | gpg --batch --decrypt | grep " node-${VERSION}.tar.xz\$" | sha256sum -c | grep ': OK$'
#
# # extract node tarball
# RUN tar -xf node-${VERSION}.tar.xz
#
# # build node
# WORKDIR node-${VERSION}
# RUN ./configure --prefix=/usr ${CONFIG_FLAGS} \
#  && make -j$(getconf _NPROCESSORS_ONLN) \
#  && make install
# RUN npm install -g npm@${NPM_VERSION}
#
# WORKDIR /worker
# RUN rm node-${VERSION}.tar.xz
#
# ADD . .
# RUN npm install @cloudflare/wrangler
