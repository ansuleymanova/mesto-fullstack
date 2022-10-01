import {useEffect, useState} from 'react';
import {Route, Switch, useHistory, withRouter} from 'react-router-dom';
import { api } from '../utils/api';
import { auth } from '../utils/auth';
import { CurrentUserContext } from '../contexts/CurrentUserContext';
import Header from './Header';
import Main from './Main';
import Footer from './Footer';
import PopupWithForm from './PopupWithForm';
import ImagePopup from './ImagePopup';
import EditProfilePopup from './EditProfilePopup';
import EditAvatarPopup from './EditAvatarPopup';
import AddPlacePopup from './AddPlacePopup';
import ProtectedRoute from './ProtectedRoute';
import Login from './Login';
import Register from './Register';
import InfoTooltip from './InfoTooltip';


function App() {
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
  const [isConfirmPopupOpen, setIsConfirmPopupOpen] = useState(false);
  const [isInfoToolTipOpen, setIsInfoToolTipOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [cards, setCards] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('jwt'));
  const [loggedIn, setLoggedIn] = useState(!!token);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successfulRegister, setSuccessfulRegister] = useState(false);
  const history = useHistory();

  function handleEmailChange(e) {
    setEmail(e.target.value);
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  function handleLogin() {
    if (!email || !password) {
      return;
    }
    auth.authorize(email, password)
        .then((res) => {
          if (res.token) {
            localStorage.setItem('email', email);
            localStorage.setItem('jwt', res.token);
            setPassword('');
            setLoggedIn(true);
            history.push('/');
          }
        }).catch((err) => {
      console.log(err);
      setSuccessfulRegister(false);
      setIsInfoToolTipOpen(true);
    });
  }

  function handleLogout() {
    setEmail('');
    localStorage.removeItem('jwt');
  }

  function closeInfoToolTip() {
      setIsInfoToolTipOpen(false);
  }

  function handleRegister() {
    if (!email || !password) {
      return;
    }
    auth.register(password, email).then((res) => {
      if (res.statusCode !== 400) {
        setPassword('');
        setSuccessfulRegister(true);
        setIsInfoToolTipOpen(true);
        history.push('/sign-in');
      }
    }).catch((err) => {
      console.log(err);
      setSuccessfulRegister(false);
      setIsInfoToolTipOpen(true);
    })
  }

  function handleCardLike(card) {
    const isLiked = card.likes.some(i => i._id === currentUser._id);
    api.toggleCardLike(card._id, isLiked).then((newCard) => {
      setCards((state) => state.map((c) => c._id ===card._id ? newCard : c))
    }).catch((err) => console.log(err))
  }

  function handleCardDelete(card) {
    api.deleteCard(card._id).then(() => {
      setCards((state) => state.filter((c) => c._id !== card._id))
    }).catch((err) => console.log(err))
  }

  function handleCardClick(card) {
    setSelectedCard(card);
  }

  function closeAllPopups() {
    setIsAddPlacePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setIsEditProfilePopupOpen(false);
    setIsConfirmPopupOpen(false);
    setSelectedCard({});
  }

    function handleEditAvatarClick() {
      setIsEditAvatarPopupOpen(true);
    }

    function handleEditProfileClick() {
      setIsEditProfilePopupOpen(true);
    }

    function handleAddPlaceClick() {
      setIsAddPlacePopupOpen(true);
    }

    function handleUpdateUser({ name, about }) {
      api.patchUserInfo({ name, about }).then((res) => {
        setCurrentUser(res);
        closeAllPopups();
      }).catch((err) => console.log(err))
    }

    function handleUpdateAvatar({avatar}) {
      api.patchAvatar({avatar: avatar}).then((link) => {
        setCurrentUser(link);
        closeAllPopups();
      }).catch((err) => console.log(err))
    }

    function handleAddPlaceSubmit({ name, link }) {
      api.postCard({name: name, link: link})
          .then((res) => {
            setCards([res, ...cards]);
            closeAllPopups();
          }).catch((err) => console.log(err))
    }

  useEffect(() => {
    setToken(localStorage.getItem('jwt'));
    if (token) {
      //check if good
      setLoggedIn(true);
      api.getUserInfo().then((userInfo) => {
        setCurrentUser(userInfo);
      }).catch((err) => console.log(err));
    } else {
      setLoggedIn(false);
    }
  }, [loggedIn])

  useEffect(() => {
    if (loggedIn) {
      api.getInitialCards().then((cards) => {
        setCards(cards);
      }).catch((err) => console.log(err));
    }
  }, [loggedIn])

    return (
        <CurrentUserContext.Provider value={currentUser}>
          <div className="App">
            <div className="page">
              <Header handleLogout={handleLogout} />
              <Switch>
                <ProtectedRoute
                    exact path="/"
                    loggedIn={loggedIn}
                    component={Main}
                    onCardClick={handleCardClick}
                    onEditProfile={handleEditProfileClick}
                    onAddPlace={handleAddPlaceClick}
                    onEditAvatar={handleEditAvatarClick}
                    cards={cards}
                    onCardLike={handleCardLike}
                    onCardDelete={handleCardDelete} />
                <Route path="/sign-up">
                  <Register
                      handleRegister={handleRegister}
                      email={email}
                      password={password}
                      onEmailChange={handleEmailChange}
                      onPasswordChange={handlePasswordChange} />
                </Route>
                <Route path="/sign-in">
                  <Login
                      handleLogin={handleLogin}
                      email={email}
                      password={password}
                      onEmailChange={handleEmailChange}
                      onPasswordChange={handlePasswordChange} />
                </Route>
              </Switch>

              <Footer />
              <EditProfilePopup isOpen={isEditProfilePopupOpen} onClose={closeAllPopups} onUpdateUser={handleUpdateUser} />
              <EditAvatarPopup isOpen={isEditAvatarPopupOpen} onClose={closeAllPopups} onUpdateAvatar={handleUpdateAvatar} />
              <AddPlacePopup isOpen={isAddPlacePopupOpen} onClose={closeAllPopups} onAddPlace={handleAddPlaceSubmit} />
              <PopupWithForm name="confirm" title="Вы уверены?" isOpen={isConfirmPopupOpen} onClose={closeAllPopups} buttonText="Да"></PopupWithForm>
              <ImagePopup card={selectedCard} onClose={closeAllPopups}/>
              <InfoTooltip isOpen={isInfoToolTipOpen} onClose={closeInfoToolTip} text={successfulRegister ? "Вы успешно зарегистрировались!" : "Что-то пошло не так! Попробуйте еще раз."}/>
            </div>
          </div>
        </CurrentUserContext.Provider>
  );
}

export default withRouter(App);
