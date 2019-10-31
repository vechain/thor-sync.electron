import { Vue, Component } from 'vue-property-decorator'
import * as Keystore from '@/common/keystore'

@Component
export default class AccountMixin extends Vue {
  public error: {
    isError: boolean;
    messages: string[];
  } = {
    isError: false,
    messages: []
  }
  public pwdChanged() {
    this.error.isError = false
    this.error.messages = []
  }
  public async checkPwd(password: string, ks?: Keystore) {
    if (ks) {
      try {
        return await Keystore.decrypt(ks, password)
      } catch (error) {
        this.error.isError = true
        this.error.messages = ['Password is invalid']
        LOG.error(error)
        return null
      }

      this.error = {
        isError: false,
        messages: []
      }
    }
  }
}
