import { Session, session, CertificateVerifyProcRequest } from 'electron'

class SessionManager {
    private readonly map = new Map<string, Session>()
    private readonly certs = new Map<string, CertificateVerifyProcRequest>()

    public manage(partition: string) {
        if (this.map.has(partition)) {
            return
        }
        const sess = session.fromPartition(partition)
        this.map.set(partition, sess)
        sess.setCertificateVerifyProc((req, callback) => {
            this.certs.set(req.hostname, req)
            if (req.verificationResult === 'net::OK') {
                callback(0)
            } else {
                callback(-3)
            }
        })
    }
    public getCertificate(hostname: string) {
        return this.certs.get(hostname)
    }
}

export default SessionManager
