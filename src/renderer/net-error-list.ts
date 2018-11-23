const map = new Map<number, { name: string, desc: string }>()
export default map

// tslint:disable:max-line-length

map.set(-1, {
    name: 'IO_PENDING', desc: `An asynchronous IO operation is not yet complete.  This usually does not
indicate a fatal error.  Typically this error will be generated as a
notification to wait for some external notification that the IO operation
finally completed.`})
map.set(-2, { name: 'FAILED', desc: `A generic failure occurred.` })
map.set(-3, { name: 'ABORTED', desc: `An operation was aborted (due to user action).` })
map.set(-4, { name: 'INVALID_ARGUMENT', desc: `An argument to the function is incorrect.` })
map.set(-5, { name: 'INVALID_HANDLE', desc: `The handle or file descriptor is invalid.` })
map.set(-6, { name: 'FILE_NOT_FOUND', desc: `The file or directory cannot be found.` })
map.set(-7, { name: 'TIMED_OUT', desc: `An operation timed out.` })
map.set(-8, { name: 'FILE_TOO_BIG', desc: `The file is too large.` })
map.set(-9, {
    name: 'UNEXPECTED', desc: `An unexpected error.  This may be caused by a programming mistake or an
invalid assumption.`})
map.set(-10, { name: 'ACCESS_DENIED', desc: `Permission to access a resource, other than the network, was denied.` })
map.set(-11, { name: 'NOT_IMPLEMENTED', desc: `The operation failed because of unimplemented functionality.` })
map.set(-12, { name: 'INSUFFICIENT_RESOURCES', desc: `There were not enough resources to complete the operation.` })
map.set(-13, { name: 'OUT_OF_MEMORY', desc: `Memory allocation failed.` })
map.set(-14, {
    name: 'UPLOAD_FILE_CHANGED', desc: `The file upload failed because the file's modification time was different
from the expectation.`})
map.set(-15, { name: 'SOCKET_NOT_CONNECTED', desc: `The socket is not connected.` })
map.set(-16, { name: 'FILE_EXISTS', desc: `The file already exists.` })
map.set(-17, { name: 'FILE_PATH_TOO_LONG', desc: `The path or file name is too long.` })
map.set(-18, { name: 'FILE_NO_SPACE', desc: `Not enough room left on the disk.` })
map.set(-19, { name: 'FILE_VIRUS_INFECTED', desc: `The file has a virus.` })
map.set(-20, { name: 'BLOCKED_BY_CLIENT', desc: `The client chose to block the request.` })
map.set(-21, { name: 'NETWORK_CHANGED', desc: `The network changed.` })
map.set(-22, {
    name: 'BLOCKED_BY_ADMINISTRATOR', desc: `The request was blocked by the URL blacklist configured by the domain
administrator.`})
map.set(-23, { name: 'SOCKET_IS_CONNECTED', desc: `The socket is already connected.` })
map.set(-24, {
    name: 'BLOCKED_ENROLLMENT_CHECK_PENDING', desc: `The request was blocked because the forced reenrollment check is still
pending. This error can only occur on ChromeOS.
The error can be emitted by code in chrome/browser/policy/policy_helpers.cc.`})
map.set(-25, {
    name: 'UPLOAD_STREAM_REWIND_NOT_SUPPORTED', desc: `The upload failed because the upload stream needed to be re-read, due to a
retry or a redirect, but the upload stream doesn't support that operation.`})
map.set(-26, {
    name: 'CONTEXT_SHUT_DOWN', desc: `The request failed because the URLRequestContext is shutting down, or has
been shut down.`})
map.set(-27, {
    name: 'BLOCKED_BY_RESPONSE', desc: `The request failed because the response was delivered along with requirements
which are not met ('X-Frame-Options' and 'Content-Security-Policy' ancestor
checks, for instance).`})
map.set(-28, {
    name: 'BLOCKED_BY_XSS_AUDITOR', desc: `The request failed after the response was received, based on client-side
heuristics that point to the possiblility of a cross-site scripting attack.`})
map.set(-29, {
    name: 'CLEARTEXT_NOT_PERMITTED', desc: `The request was blocked by system policy disallowing some or all cleartext
requests. Used for NetworkSecurityPolicy on Android.`})
map.set(-100, { name: 'CONNECTION_CLOSED', desc: `A connection was closed (corresponding to a TCP FIN).` })
map.set(-101, { name: 'CONNECTION_RESET', desc: `A connection was reset (corresponding to a TCP RST).` })
map.set(-102, { name: 'CONNECTION_REFUSED', desc: `A connection attempt was refused.` })
map.set(-103, {
    name: 'CONNECTION_ABORTED', desc: `A connection timed out as a result of not receiving an ACK for data sent.
This can include a FIN packet that did not get ACK'd.`})
map.set(-104, { name: 'CONNECTION_FAILED', desc: `A connection attempt failed.` })
map.set(-105, { name: 'NAME_NOT_RESOLVED', desc: `The host name could not be resolved.` })
map.set(-106, { name: 'INTERNET_DISCONNECTED', desc: `The Internet connection has been lost.` })
map.set(-107, { name: 'SSL_PROTOCOL_ERROR', desc: `An SSL protocol error occurred.` })
map.set(-108, {
    name: 'ADDRESS_INVALID', desc: `The IP address or port number is invalid (e.g., cannot connect to the IP
address 0 or the port 0).`})
map.set(-109, {
    name: 'ADDRESS_UNREACHABLE', desc: `The IP address is unreachable.  This usually means that there is no route to
the specified host or network.`})
map.set(-110, { name: 'SSL_CLIENT_AUTH_CERT_NEEDED', desc: `The server requested a client certificate for SSL client authentication.` })
map.set(-111, { name: 'TUNNEL_CONNECTION_FAILED', desc: `A tunnel connection through the proxy could not be established.` })
map.set(-112, { name: 'NO_SSL_VERSIONS_ENABLED', desc: `No SSL protocol versions are enabled.` })
map.set(-113, {
    name: 'SSL_VERSION_OR_CIPHER_MISMATCH', desc: `The client and server don't support a common SSL protocol version or
cipher suite.`})
map.set(-114, { name: 'SSL_RENEGOTIATION_REQUESTED', desc: `The server requested a renegotiation (rehandshake).` })
map.set(-115, {
    name: 'PROXY_AUTH_UNSUPPORTED', desc: `The proxy requested authentication (for tunnel establishment) with an
unsupported method.`})
map.set(-116, {
    name: 'CERT_ERROR_IN_SSL_RENEGOTIATION', desc: `During SSL renegotiation (rehandshake), the server sent a certificate with
an error.

Note: this error is not in the -2xx range so that it won't be handled as a
certificate error.`})
map.set(-117, { name: 'BAD_SSL_CLIENT_AUTH_CERT', desc: `The SSL handshake failed because of a bad or missing client certificate.` })
map.set(-118, { name: 'CONNECTION_TIMED_OUT', desc: `A connection attempt timed out.` })
map.set(-119, {
    name: 'HOST_RESOLVER_QUEUE_TOO_LARGE', desc: `There are too many pending DNS resolves, so a request in the queue was
aborted.`})
map.set(-120, { name: 'SOCKS_CONNECTION_FAILED', desc: `Failed establishing a connection to the SOCKS proxy server for a target host.` })
map.set(-121, {
    name: 'SOCKS_CONNECTION_HOST_UNREACHABLE', desc: `The SOCKS proxy server failed establishing connection to the target host
because that host is unreachable.`})
map.set(-122, { name: 'ALPN_NEGOTIATION_FAILED', desc: `The request to negotiate an alternate protocol failed.` })
map.set(-123, { name: 'SSL_NO_RENEGOTIATION', desc: `The peer sent an SSL no_renegotiation alert message.` })
map.set(-124, {
    name: 'WINSOCK_UNEXPECTED_WRITTEN_BYTES', desc: `Winsock sometimes reports more data written than passed.  This is probably
due to a broken LSP.`})
map.set(-125, {
    name: 'SSL_DECOMPRESSION_FAILURE_ALERT', desc: `An SSL peer sent us a fatal decompression_failure alert. This typically
occurs when a peer selects DEFLATE compression in the mistaken belief that
it supports it.`})
map.set(-126, {
    name: 'SSL_BAD_RECORD_MAC_ALERT', desc: `An SSL peer sent us a fatal bad_record_mac alert. This has been observed
from servers with buggy DEFLATE support.`})
map.set(-127, { name: 'PROXY_AUTH_REQUESTED', desc: `The proxy requested authentication (for tunnel establishment).` })
map.set(-129, { name: 'SSL_WEAK_SERVER_EPHEMERAL_DH_KEY', desc: `The SSL server attempted to use a weak ephemeral Diffie-Hellman key.` })
map.set(-130, {
    name: 'PROXY_CONNECTION_FAILED', desc: `Could not create a connection to the proxy server. An error occurred
either in resolving its name, or in connecting a socket to it.
Note that this does NOT include failures during the actual "CONNECT" method
of an HTTP proxy.`})
map.set(-131, {
    name: 'MANDATORY_PROXY_CONFIGURATION_FAILED', desc: `A mandatory proxy configuration could not be used. Currently this means
that a mandatory PAC script could not be fetched, parsed or executed.`})
map.set(-133, {
    name: 'PRECONNECT_MAX_SOCKET_LIMIT', desc: `-132 was formerly ERR_ESET_ANTI_VIRUS_SSL_INTERCEPTION
We've hit the max socket limit for the socket pool while preconnecting.  We
don't bother trying to preconnect more sockets.`})
map.set(-134, { name: 'SSL_CLIENT_AUTH_PRIVATE_KEY_ACCESS_DENIED', desc: `The permission to use the SSL client certificate's private key was denied.` })
map.set(-135, { name: 'SSL_CLIENT_AUTH_CERT_NO_PRIVATE_KEY', desc: `The SSL client certificate has no private key.` })
map.set(-136, { name: 'PROXY_CERTIFICATE_INVALID', desc: `The certificate presented by the HTTPS Proxy was invalid.` })
map.set(-137, { name: 'NAME_RESOLUTION_FAILED', desc: `An error occurred when trying to do a name resolution (DNS).` })
map.set(-138, {
    name: 'NETWORK_ACCESS_DENIED', desc: `Permission to access the network was denied. This is used to distinguish
errors that were most likely caused by a firewall from other access denied
errors. See also ERR_ACCESS_DENIED.`})
map.set(-139, { name: 'TEMPORARILY_THROTTLED', desc: `The request throttler module cancelled this request to avoid DDOS.` })
map.set(-140, {
    name: 'HTTPS_PROXY_TUNNEL_RESPONSE', desc: `A request to create an SSL tunnel connection through the HTTPS proxy
received a non-200 (OK) and non-407 (Proxy Auth) response.  The response
body might include a description of why the request failed.`})
map.set(-141, {
    name: 'SSL_CLIENT_AUTH_SIGNATURE_FAILED', desc: `We were unable to sign the CertificateVerify data of an SSL client auth
handshake with the client certificate's private key.

Possible causes for this include the user implicitly or explicitly
denying access to the private key, the private key may not be valid for
signing, the key may be relying on a cached handle which is no longer
valid, or the CSP won't allow arbitrary data to be signed.`})
map.set(-142, {
    name: 'MSG_TOO_BIG', desc: `The message was too large for the transport.  (for example a UDP message
which exceeds size threshold).`})
map.set(-143, { name: 'SPDY_SESSION_ALREADY_EXISTS', desc: `A SPDY session already exists, and should be used instead of this connection.` })
map.set(-145, {
    name: 'WS_PROTOCOL_ERROR', desc: `Error -144 was removed (LIMIT_VIOLATION).
Websocket protocol error. Indicates that we are terminating the connection
due to a malformed frame or other protocol violation.`})
map.set(-147, {
    name: 'ADDRESS_IN_USE', desc: `Error -146 was removed (PROTOCOL_SWITCHED)
Returned when attempting to bind an address that is already in use.`})
map.set(-148, { name: 'SSL_HANDSHAKE_NOT_COMPLETED', desc: `An operation failed because the SSL handshake has not completed.` })
map.set(-149, { name: 'SSL_BAD_PEER_PUBLIC_KEY', desc: `SSL peer's public key is invalid.` })
map.set(-150, {
    name: 'SSL_PINNED_KEY_NOT_IN_CERT_CHAIN', desc: `The certificate didn't match the built-in public key pins for the host name.
The pins are set in net/http/transport_security_state.cc and require that
one of a set of public keys exist on the path from the leaf to the root.`})
map.set(-151, { name: 'CLIENT_AUTH_CERT_TYPE_UNSUPPORTED', desc: `Server request for client certificate did not contain any types we support.` })
map.set(-152, {
    name: 'ORIGIN_BOUND_CERT_GENERATION_TYPE_MISMATCH', desc: `Server requested one type of cert, then requested a different type while the
first was still being generated.`})
map.set(-153, {
    name: 'SSL_DECRYPT_ERROR_ALERT', desc: `An SSL peer sent us a fatal decrypt_error alert. This typically occurs when
a peer could not correctly verify a signature (in CertificateVerify or
ServerKeyExchange) or validate a Finished message.`})
map.set(-154, {
    name: 'WS_THROTTLE_QUEUE_TOO_LARGE', desc: `There are too many pending WebSocketJob instances, so the new job was not
pushed to the queue.`})
map.set(-156, {
    name: 'SSL_SERVER_CERT_CHANGED', desc: `Error -155 was removed (TOO_MANY_SOCKET_STREAMS)
The SSL server certificate changed in a renegotiation.`})
map.set(-159, {
    name: 'SSL_UNRECOGNIZED_NAME_ALERT', desc: `Error -157 was removed (SSL_INAPPROPRIATE_FALLBACK).
Error -158 was removed (CT_NO_SCTS_VERIFIED_OK).
The SSL server sent us a fatal unrecognized_name alert.`})
map.set(-160, { name: 'SOCKET_SET_RECEIVE_BUFFER_SIZE_ERROR', desc: `Failed to set the socket's receive buffer size as requested.` })
map.set(-161, { name: 'SOCKET_SET_SEND_BUFFER_SIZE_ERROR', desc: `Failed to set the socket's send buffer size as requested.` })
map.set(-162, {
    name: 'SOCKET_RECEIVE_BUFFER_SIZE_UNCHANGEABLE', desc: `Failed to set the socket's receive buffer size as requested, despite success
return code from setsockopt.`})
map.set(-163, {
    name: 'SOCKET_SEND_BUFFER_SIZE_UNCHANGEABLE', desc: `Failed to set the socket's send buffer size as requested, despite success
return code from setsockopt.`})
map.set(-164, {
    name: 'SSL_CLIENT_AUTH_CERT_BAD_FORMAT', desc: `Failed to import a client certificate from the platform store into the SSL
library.`})
map.set(-166, {
    name: 'ICANN_NAME_COLLISION', desc: `Error -165 was removed (SSL_FALLBACK_BEYOND_MINIMUM_VERSION).
Resolving a hostname to an IP address list included the IPv4 address
"127.0.53.53". This is a special IP address which ICANN has recommended to
indicate there was a name collision, and alert admins to a potential
problem.`})
map.set(-167, {
    name: 'SSL_SERVER_CERT_BAD_FORMAT', desc: `The SSL server presented a certificate which could not be decoded. This is
not a certificate error code as no X509Certificate object is available. This
error is fatal.`})
map.set(-168, { name: 'CT_STH_PARSING_FAILED', desc: `Certificate Transparency: Received a signed tree head that failed to parse.` })
map.set(-169, {
    name: 'CT_STH_INCOMPLETE', desc: `Certificate Transparency: Received a signed tree head whose JSON parsing was
OK but was missing some of the fields.`})
map.set(-170, {
    name: 'UNABLE_TO_REUSE_CONNECTION_FOR_PROXY_AUTH', desc: `The attempt to reuse a connection to send proxy auth credentials failed
before the AuthController was used to generate credentials. The caller should
reuse the controller with a new connection. This error is only used
internally by the network stack.`})
map.set(-171, { name: 'CT_CONSISTENCY_PROOF_PARSING_FAILED', desc: `Certificate Transparency: Failed to parse the received consistency proof.` })
map.set(-172, {
    name: 'SSL_OBSOLETE_CIPHER', desc: `The SSL server required an unsupported cipher suite that has since been
removed. This error will temporarily be signaled on a fallback for one or two
releases immediately following a cipher suite's removal, after which the
fallback will be removed.`})
map.set(-173, {
    name: 'WS_UPGRADE', desc: `When a WebSocket handshake is done successfully and the connection has been
upgraded, the URLRequest is cancelled with this error code.`})
map.set(-174, {
    name: 'READ_IF_READY_NOT_IMPLEMENTED', desc: `Socket ReadIfReady support is not implemented. This error should not be user
visible, because the normal Read() method is used as a fallback.`})
map.set(-175, {
    name: 'SSL_VERSION_INTERFERENCE', desc: `This error is emitted if TLS 1.3 is enabled, connecting with it failed, but
retrying at a downgraded maximum version succeeded. This could mean:

1. This is a transient network error that will be resolved when the user
reloads.

2. The user is behind a buggy network middlebox, firewall, or proxy which is
interfering with TLS 1.3.

3. The server is buggy and does not implement TLS version negotiation
correctly. TLS 1.3 was tweaked to avoid a common server bug here, so this
is unlikely.`})
map.set(-176, { name: 'NO_BUFFER_SPACE', desc: `No socket buffer space is available.` })
map.set(-177, {
    name: 'SSL_CLIENT_AUTH_NO_COMMON_ALGORITHMS', desc: `There were no common signature algorithms between our client certificate
private key and the server's preferences.`})
map.set(-178, {
    name: 'EARLY_DATA_REJECTED', desc: `TLS 1.3 early data was rejected by the server. This will be received before
any data is returned from the socket. The request should be retried with
early data disabled.`})
map.set(-179, {
    name: 'WRONG_VERSION_ON_EARLY_DATA', desc: `TLS 1.3 early data was offered, but the server responded with TLS 1.2 or
earlier. This is an internal error code to account for a
backwards-compatibility issue with early data and TLS 1.2. It will be
received before any data is returned from the socket. The request should be
retried with early data disabled.

See https://tools.ietf.org/html/rfc8446#appendix-D.3 for details.`})
map.set(-180, {
    name: 'TLS13_DOWNGRADE_DETECTED', desc: `TLS 1.3 was enabled, but a lower version was negotiated and the server
returned a value indicating it supported TLS 1.3. This is part of a security
check in TLS 1.3, but it may also indicate the user is behind a buggy
TLS-terminating proxy which implemented TLS 1.2 incorrectly. (See
https://crbug.com/boringssl/226.)`})
map.set(-200, {
    name: 'CERT_COMMON_NAME_INVALID', desc: `Certificate error codes

The values of certificate error codes must be consecutive.
The server responded with a certificate whose common name did not match
the host name.  This could mean:

1. An attacker has redirected our traffic to their server and is
presenting a certificate for which they know the private key.

2. The server is misconfigured and responding with the wrong cert.

3. The user is on a wireless network and is being redirected to the
network's login page.

4. The OS has used a DNS search suffix and the server doesn't have
a certificate for the abbreviated name in the address bar.`})
map.set(-201, {
    name: 'CERT_DATE_INVALID', desc: `The server responded with a certificate that, by our clock, appears to
either not yet be valid or to have expired.  This could mean:

1. An attacker is presenting an old certificate for which they have
managed to obtain the private key.

2. The server is misconfigured and is not presenting a valid cert.

3. Our clock is wrong.`})
map.set(-202, {
    name: 'CERT_AUTHORITY_INVALID', desc: `The server responded with a certificate that is signed by an authority
we don't trust.  The could mean:

1. An attacker has substituted the real certificate for a cert that
contains their public key and is signed by their cousin.

2. The server operator has a legitimate certificate from a CA we don't
know about, but should trust.

3. The server is presenting a self-signed certificate, providing no
defense against active attackers (but foiling passive attackers).`})
map.set(-203, {
    name: 'CERT_CONTAINS_ERRORS', desc: `The server responded with a certificate that contains errors.
This error is not recoverable.

MSDN describes this error as follows:
"The SSL certificate contains errors."
NOTE: It's unclear how this differs from ERR_CERT_INVALID. For consistency,
use that code instead of this one from now on.`})
map.set(-204, {
    name: 'CERT_NO_REVOCATION_MECHANISM', desc: `The certificate has no mechanism for determining if it is revoked.  In
effect, this certificate cannot be revoked.`})
map.set(-205, {
    name: 'CERT_UNABLE_TO_CHECK_REVOCATION', desc: `Revocation information for the security certificate for this site is not
available.  This could mean:

1. An attacker has compromised the private key in the certificate and is
blocking our attempt to find out that the cert was revoked.

2. The certificate is unrevoked, but the revocation server is busy or
unavailable.`})
map.set(-206, {
    name: 'CERT_REVOKED', desc: `The server responded with a certificate has been revoked.
We have the capability to ignore this error, but it is probably not the
thing to do.`})
map.set(-207, {
    name: 'CERT_INVALID', desc: `The server responded with a certificate that is invalid.
This error is not recoverable.

MSDN describes this error as follows:
"The SSL certificate is invalid."`})
map.set(-208, {
    name: 'CERT_WEAK_SIGNATURE_ALGORITHM', desc: `The server responded with a certificate that is signed using a weak
signature algorithm.`})
map.set(-210, {
    name: 'CERT_NON_UNIQUE_NAME', desc: `-209 is availible: was CERT_NOT_IN_DNS.
The host name specified in the certificate is not unique.`})
map.set(-211, {
    name: 'CERT_WEAK_KEY', desc: `The server responded with a certificate that contains a weak key (e.g.
a too-small RSA key).`})
map.set(-212, { name: 'CERT_NAME_CONSTRAINT_VIOLATION', desc: `The certificate claimed DNS names that are in violation of name constraints.` })
map.set(-213, { name: 'CERT_VALIDITY_TOO_LONG', desc: `The certificate's validity period is too long.` })
map.set(-214, {
    name: 'CERTIFICATE_TRANSPARENCY_REQUIRED', desc: `Certificate Transparency was required for this connection, but the server
did not provide CT information that complied with the policy.`})
map.set(-215, {
    name: 'CERT_SYMANTEC_LEGACY', desc: `The certificate chained to a legacy Symantec root that is no longer trusted.
https://g.co/chrome/symantecpkicerts`})
map.set(-216, {
    name: 'CERT_END', desc: `Add new certificate error codes here.

Update the value of CERT_END whenever you add a new certificate error
code.
The value immediately past the last certificate error code.`})
map.set(-300, { name: 'INVALID_URL', desc: `The URL is invalid.` })
map.set(-301, { name: 'DISALLOWED_URL_SCHEME', desc: `The scheme of the URL is disallowed.` })
map.set(-302, { name: 'UNKNOWN_URL_SCHEME', desc: `The scheme of the URL is unknown.` })
map.set(-303, { name: 'INVALID_REDIRECT', desc: `Attempting to load an URL resulted in a redirect to an invalid URL.` })
map.set(-310, { name: 'TOO_MANY_REDIRECTS', desc: `Attempting to load an URL resulted in too many redirects.` })
map.set(-311, {
    name: 'UNSAFE_REDIRECT', desc: `Attempting to load an URL resulted in an unsafe redirect (e.g., a redirect
to file:// is considered unsafe).`})
map.set(-312, {
    name: 'UNSAFE_PORT', desc: `Attempting to load an URL with an unsafe port number.  These are port
numbers that correspond to services, which are not robust to spurious input
that may be constructed as a result of an allowed web construct (e.g., HTTP
looks a lot like SMTP, so form submission to port 25 is denied).`})
map.set(-320, { name: 'INVALID_RESPONSE', desc: `The server's response was invalid.` })
map.set(-321, { name: 'INVALID_CHUNKED_ENCODING', desc: `Error in chunked transfer encoding.` })
map.set(-322, { name: 'METHOD_NOT_SUPPORTED', desc: `The server did not support the request method.` })
map.set(-323, {
    name: 'UNEXPECTED_PROXY_AUTH', desc: `The response was 407 (Proxy Authentication Required), yet we did not send
the request to a proxy.`})
map.set(-324, { name: 'EMPTY_RESPONSE', desc: `The server closed the connection without sending any data.` })
map.set(-325, { name: 'RESPONSE_HEADERS_TOO_BIG', desc: `The headers section of the response is too large.` })
map.set(-326, { name: 'PAC_STATUS_NOT_OK', desc: `The PAC requested by HTTP did not have a valid status code (non-200).` })
map.set(-327, { name: 'PAC_SCRIPT_FAILED', desc: `The evaluation of the PAC script failed.` })
map.set(-328, {
    name: 'REQUEST_RANGE_NOT_SATISFIABLE', desc: `The response was 416 (Requested range not satisfiable) and the server cannot
satisfy the range requested.`})
map.set(-329, { name: 'MALFORMED_IDENTITY', desc: `The identity used for authentication is invalid.` })
map.set(-330, { name: 'CONTENT_DECODING_FAILED', desc: `Content decoding of the response body failed.` })
map.set(-331, {
    name: 'NETWORK_IO_SUSPENDED', desc: `An operation could not be completed because all network IO
is suspended.`})
map.set(-332, { name: 'SYN_REPLY_NOT_RECEIVED', desc: `FLIP data received without receiving a SYN_REPLY on the stream.` })
map.set(-333, { name: 'ENCODING_CONVERSION_FAILED', desc: `Converting the response to target encoding failed.` })
map.set(-334, { name: 'UNRECOGNIZED_FTP_DIRECTORY_LISTING_FORMAT', desc: `The server sent an FTP directory listing in a format we do not understand.` })
map.set(-336, {
    name: 'NO_SUPPORTED_PROXIES', desc: `Obsolete.  Was only logged in NetLog when an HTTP/2 pushed stream expired.
NET_ERROR(INVALID_SPDY_STREAM, -335)
There are no supported proxies in the provided list.`})
map.set(-337, { name: 'SPDY_PROTOCOL_ERROR', desc: `There is a SPDY protocol error.` })
map.set(-338, { name: 'INVALID_AUTH_CREDENTIALS', desc: `Credentials could not be established during HTTP Authentication.` })
map.set(-339, {
    name: 'UNSUPPORTED_AUTH_SCHEME', desc: `An HTTP Authentication scheme was tried which is not supported on this
machine.`})
map.set(-340, { name: 'ENCODING_DETECTION_FAILED', desc: `Detecting the encoding of the response failed.` })
map.set(-341, { name: 'MISSING_AUTH_CREDENTIALS', desc: `(GSSAPI) No Kerberos credentials were available during HTTP Authentication.` })
map.set(-342, { name: 'UNEXPECTED_SECURITY_LIBRARY_STATUS', desc: `An unexpected, but documented, SSPI or GSSAPI status code was returned.` })
map.set(-343, {
    name: 'MISCONFIGURED_AUTH_ENVIRONMENT', desc: `The environment was not set up correctly for authentication (for
example, no KDC could be found or the principal is unknown.`})
map.set(-344, { name: 'UNDOCUMENTED_SECURITY_LIBRARY_STATUS', desc: `An undocumented SSPI or GSSAPI status code was returned.` })
map.set(-345, { name: 'RESPONSE_BODY_TOO_BIG_TO_DRAIN', desc: `The HTTP response was too big to drain.` })
map.set(-346, { name: 'RESPONSE_HEADERS_MULTIPLE_CONTENT_LENGTH', desc: `The HTTP response contained multiple distinct Content-Length headers.` })
map.set(-347, {
    name: 'INCOMPLETE_SPDY_HEADERS', desc: `SPDY Headers have been received, but not all of them - status or version
headers are missing, so we're expecting additional frames to complete them.`})
map.set(-348, {
    name: 'PAC_NOT_IN_DHCP', desc: `No PAC URL configuration could be retrieved from DHCP. This can indicate
either a failure to retrieve the DHCP configuration, or that there was no
PAC URL configured in DHCP.`})
map.set(-349, { name: 'RESPONSE_HEADERS_MULTIPLE_CONTENT_DISPOSITION', desc: `The HTTP response contained multiple Content-Disposition headers.` })
map.set(-350, { name: 'RESPONSE_HEADERS_MULTIPLE_LOCATION', desc: `The HTTP response contained multiple Location headers.` })
map.set(-351, {
    name: 'SPDY_SERVER_REFUSED_STREAM', desc: `HTTP/2 server refused the request without processing, and sent either a
GOAWAY frame with error code NO_ERROR and Last-Stream-ID lower than the
stream id corresponding to the request indicating that this request has not
been processed yet, or a RST_STREAM frame with error code REFUSED_STREAM.
Client MAY retry (on a different connection).  See RFC7540 Section 8.1.4.`})
map.set(-352, { name: 'SPDY_PING_FAILED', desc: `SPDY server didn't respond to the PING message.` })
map.set(-354, {
    name: 'CONTENT_LENGTH_MISMATCH', desc: `Obsolete.  Kept here to avoid reuse, as the old error can still appear on
histograms.
NET_ERROR(PIPELINE_EVICTION, -353)
The HTTP response body transferred fewer bytes than were advertised by the
Content-Length header when the connection is closed.`})
map.set(-355, {
    name: 'INCOMPLETE_CHUNKED_ENCODING', desc: `The HTTP response body is transferred with Chunked-Encoding, but the
terminating zero-length chunk was never sent when the connection is closed.`})
map.set(-356, { name: 'QUIC_PROTOCOL_ERROR', desc: `There is a QUIC protocol error.` })
map.set(-357, { name: 'RESPONSE_HEADERS_TRUNCATED', desc: `The HTTP headers were truncated by an EOF.` })
map.set(-358, {
    name: 'QUIC_HANDSHAKE_FAILED', desc: `The QUIC crytpo handshake failed.  This means that the server was unable
to read any requests sent, so they may be resent.`})
map.set(-360, {
    name: 'SPDY_INADEQUATE_TRANSPORT_SECURITY', desc: `Obsolete.  Kept here to avoid reuse, as the old error can still appear on
histograms.
NET_ERROR(REQUEST_FOR_SECURE_RESOURCE_OVER_INSECURE_QUIC, -359)
Transport security is inadequate for the SPDY version.`})
map.set(-361, { name: 'SPDY_FLOW_CONTROL_ERROR', desc: `The peer violated SPDY flow control.` })
map.set(-362, { name: 'SPDY_FRAME_SIZE_ERROR', desc: `The peer sent an improperly sized SPDY frame.` })
map.set(-363, { name: 'SPDY_COMPRESSION_ERROR', desc: `Decoding or encoding of compressed SPDY headers failed.` })
map.set(-364, { name: 'PROXY_AUTH_REQUESTED_WITH_NO_CONNECTION', desc: `Proxy Auth Requested without a valid Client Socket Handle.` })
map.set(-365, { name: 'HTTP_1_1_REQUIRED', desc: `HTTP_1_1_REQUIRED error code received on HTTP/2 session.` })
map.set(-366, { name: 'PROXY_HTTP_1_1_REQUIRED', desc: `HTTP_1_1_REQUIRED error code received on HTTP/2 session to proxy.` })
map.set(-367, { name: 'PAC_SCRIPT_TERMINATED', desc: `The PAC script terminated fatally and must be reloaded.` })
map.set(-370, {
    name: 'INVALID_HTTP_RESPONSE', desc: `Obsolete. Kept here to avoid reuse.
Request is throttled because of a Backoff header.
See: crbug.com/486891.
NET_ERROR(TEMPORARY_BACKOFF, -369)
The server was expected to return an HTTP/1.x response, but did not. Rather
than treat it as HTTP/0.9, this error is returned.`})
map.set(-371, { name: 'CONTENT_DECODING_INIT_FAILED', desc: `Initializing content decoding failed.` })
map.set(-372, {
    name: 'SPDY_RST_STREAM_NO_ERROR_RECEIVED', desc: `Received HTTP/2 RST_STREAM frame with NO_ERROR error code.  This error should
be handled internally by HTTP/2 code, and should not make it above the
SpdyStream layer.`})
map.set(-373, { name: 'SPDY_PUSHED_STREAM_NOT_AVAILABLE', desc: `The pushed stream claimed by the request is no longer available.` })
map.set(-374, {
    name: 'SPDY_CLAIMED_PUSHED_STREAM_RESET_BY_SERVER', desc: `A pushed stream was claimed and later reset by the server. When this happens,
the request should be retried.`})
map.set(-375, {
    name: 'TOO_MANY_RETRIES', desc: `An HTTP transaction was retried too many times due for authentication or
invalid certificates. This may be due to a bug in the net stack that would
otherwise infinite loop, or if the server or proxy continually requests fresh
credentials or presents a fresh invalid certificate.`})
map.set(-376, { name: 'SPDY_STREAM_CLOSED', desc: `Received an HTTP/2 frame on a closed stream.` })
map.set(-377, { name: 'SPDY_CLIENT_REFUSED_STREAM', desc: `Client is refusing an HTTP/2 stream.` })
map.set(-378, {
    name: 'SPDY_PUSHED_RESPONSE_DOES_NOT_MATCH', desc: `A pushed HTTP/2 stream was claimed by a request based on matching URL and
request headers, but the pushed response headers do not match the request.`})
map.set(-400, { name: 'CACHE_MISS', desc: `The cache does not have the requested entry.` })
map.set(-401, { name: 'CACHE_READ_FAILURE', desc: `Unable to read from the disk cache.` })
map.set(-402, { name: 'CACHE_WRITE_FAILURE', desc: `Unable to write to the disk cache.` })
map.set(-403, { name: 'CACHE_OPERATION_NOT_SUPPORTED', desc: `The operation is not supported for this entry.` })
map.set(-404, { name: 'CACHE_OPEN_FAILURE', desc: `The disk cache is unable to open this entry.` })
map.set(-405, { name: 'CACHE_CREATE_FAILURE', desc: `The disk cache is unable to create this entry.` })
map.set(-406, {
    name: 'CACHE_RACE', desc: `Multiple transactions are racing to create disk cache entries. This is an
internal error returned from the HttpCache to the HttpCacheTransaction that
tells the transaction to restart the entry-creation logic because the state
of the cache has changed.`})
map.set(-407, {
    name: 'CACHE_CHECKSUM_READ_FAILURE', desc: `The cache was unable to read a checksum record on an entry. This can be
returned from attempts to read from the cache. It is an internal error,
returned by the SimpleCache backend, but not by any URLRequest methods
or members.`})
map.set(-408, {
    name: 'CACHE_CHECKSUM_MISMATCH', desc: `The cache found an entry with an invalid checksum. This can be returned from
attempts to read from the cache. It is an internal error, returned by the
SimpleCache backend, but not by any URLRequest methods or members.`})
map.set(-409, { name: 'CACHE_LOCK_TIMEOUT', desc: `Internal error code for the HTTP cache. The cache lock timeout has fired.` })
map.set(-410, {
    name: 'CACHE_AUTH_FAILURE_AFTER_READ', desc: `Received a challenge after the transaction has read some data, and the
credentials aren't available.  There isn't a way to get them at that point.`})
map.set(-411, {
    name: 'CACHE_ENTRY_NOT_SUITABLE', desc: `Internal not-quite error code for the HTTP cache. In-memory hints suggest
that the cache entry would not have been useable with the transaction's
current configuration (e.g. load flags, mode, etc.)`})
map.set(-501, { name: 'INSECURE_RESPONSE', desc: `The server's response was insecure (e.g. there was a cert error).` })
map.set(-502, {
    name: 'NO_PRIVATE_KEY_FOR_CERT', desc: `An attempt to import a client certificate failed, as the user's key
database lacked a corresponding private key.`})
map.set(-503, { name: 'ADD_USER_CERT_FAILED', desc: `An error adding a certificate to the OS certificate database.` })
map.set(-504, { name: 'INVALID_SIGNED_EXCHANGE', desc: `An error occurred while handling a signed exchange.` })
map.set(-601, {
    name: 'FTP_FAILED', desc: `*** Code -600 is reserved (was FTP_PASV_COMMAND_FAILED). ***
A generic error for failed FTP control connection command.
If possible, please use or add a more specific error code.`})
map.set(-602, {
    name: 'FTP_SERVICE_UNAVAILABLE', desc: `The server cannot fulfill the request at this point. This is a temporary
error.
FTP response code 421.`})
map.set(-603, {
    name: 'FTP_TRANSFER_ABORTED', desc: `The server has aborted the transfer.
FTP response code 426.`})
map.set(-604, {
    name: 'FTP_FILE_BUSY', desc: `The file is busy, or some other temporary error condition on opening
the file.
FTP response code 450.`})
map.set(-605, {
    name: 'FTP_SYNTAX_ERROR', desc: `Server rejected our command because of syntax errors.
FTP response codes 500, 501.`})
map.set(-606, {
    name: 'FTP_COMMAND_NOT_SUPPORTED', desc: `Server does not support the command we issued.
FTP response codes 502, 504.`})
map.set(-607, {
    name: 'FTP_BAD_COMMAND_SEQUENCE', desc: `Server rejected our command because we didn't issue the commands in right
order.
FTP response code 503.`})
map.set(-701, { name: 'PKCS12_IMPORT_BAD_PASSWORD', desc: `PKCS #12 import failed due to incorrect password.` })
map.set(-702, { name: 'PKCS12_IMPORT_FAILED', desc: `PKCS #12 import failed due to other error.` })
map.set(-703, { name: 'IMPORT_CA_CERT_NOT_CA', desc: `CA import failed - not a CA cert.` })
map.set(-704, {
    name: 'IMPORT_CERT_ALREADY_EXISTS', desc: `Import failed - certificate already exists in database.
Note it's a little weird this is an error but reimporting a PKCS12 is ok
(no-op).  That's how Mozilla does it, though.`})
map.set(-705, { name: 'IMPORT_CA_CERT_FAILED', desc: `CA import failed due to some other error.` })
map.set(-706, { name: 'IMPORT_SERVER_CERT_FAILED', desc: `Server certificate import failed due to some internal error.` })
map.set(-707, { name: 'PKCS12_IMPORT_INVALID_MAC', desc: `PKCS #12 import failed due to invalid MAC.` })
map.set(-708, { name: 'PKCS12_IMPORT_INVALID_FILE', desc: `PKCS #12 import failed due to invalid/corrupt file.` })
map.set(-709, { name: 'PKCS12_IMPORT_UNSUPPORTED', desc: `PKCS #12 import failed due to unsupported features.` })
map.set(-710, { name: 'KEY_GENERATION_FAILED', desc: `Key generation failed.` })
map.set(-712, {
    name: 'PRIVATE_KEY_EXPORT_FAILED', desc: `Error -711 was removed (ORIGIN_BOUND_CERT_GENERATION_FAILED)
Failure to export private key.`})
map.set(-713, { name: 'SELF_SIGNED_CERT_GENERATION_FAILED', desc: `Self-signed certificate generation failed.` })
map.set(-714, { name: 'CERT_DATABASE_CHANGED', desc: `The certificate database changed in some way.` })
map.set(-800, {
    name: 'DNS_MALFORMED_RESPONSE', desc: `Error -715 was removed (CHANNEL_ID_IMPORT_FAILED)
DNS error codes.
DNS resolver received a malformed response.`})
map.set(-801, { name: 'DNS_SERVER_REQUIRES_TCP', desc: `DNS server requires TCP` })
map.set(-802, {
    name: 'DNS_SERVER_FAILED', desc: `DNS server failed.  This error is returned for all of the following
error conditions:
1 - Format error - The name server was unable to interpret the query.
2 - Server failure - The name server was unable to process this query
due to a problem with the name server.
4 - Not Implemented - The name server does not support the requested
kind of query.
5 - Refused - The name server refuses to perform the specified
operation for policy reasons.`})
map.set(-803, { name: 'DNS_TIMED_OUT', desc: `DNS transaction timed out.` })
map.set(-804, { name: 'DNS_CACHE_MISS', desc: `The entry was not found in cache, for cache-only lookups.` })
map.set(-805, { name: 'DNS_SEARCH_EMPTY', desc: `Suffix search list rules prevent resolution of the given host name.` })
map.set(-806, { name: 'DNS_SORT_ERROR', desc: `Failed to sort addresses according to RFC3484.` })
map.set(-807, { name: 'DNS_HTTP_FAILED', desc: `Failed to resolve over HTTP, fallback to legacy` })
