import { Vue, Component } from 'vue-property-decorator'
import { cry } from 'thor-devkit'
@Component
export default class AccountMixin extends Vue {
  public error: {
    isError: boolean;
    messages: string[];
  } = {
    isError: false,
    messages: []
  }

  public async checkPwd(password: string, ks?: cry.Keystore) {
    if (ks) {
      try {
        return await cry.Keystore.decrypt(ks, password)
      } catch (error) {
        this.error.isError = true
        this.error.messages = ['Password is invalid']
        console.error(error)

        return null
      }

      this.error = {
        isError: false,
        messages: []
      }
    }
  }
}
