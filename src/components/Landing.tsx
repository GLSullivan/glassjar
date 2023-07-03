import landing from './../media/images/landing_hero.jpg'
import logo from './../media/images/glassjar_logo1.svg'
import copyright from './../media/images/copyright.svg'

import './../css/Landing.css';

function Landing() {

  return (
    <div className='glassjar__landing'>
      <div>
        <form className='glassjar__landing__form'>
          <h1>Welcome</h1>
          <div>
            <input type="text" name="" id="" />
            <input type="password" name="" id="" />
            <button>Sign In</button>
            <p>Don't have an account? <span className='glassjar__text-link'>Sign up</span></p>
          </div>
        </form>
        <img className='glassjar__landing__img glassjar__landing__img--hero' src={landing} alt="" />
      </div>
      <img className='glassjar__landing__img glassjar__landing__img--logo' src={logo} alt="" />
      <img className='glassjar__landing__img glassjar__landing__img--copyright' src={copyright} alt="" />
    </div>
  )
}

export default Landing;


