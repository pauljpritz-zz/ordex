<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'ordex-frontend',
  };
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

#logo {
  height: auto;
  margin-bottom: 20px;
  width: 250px;
}

#wrapper {
  overflow-x: hidden;
  background:
    radial-gradient(
      ellipse at top left,
      rgba(255, 255, 255, 1) 40%,
      rgba(229, 229, 229, .9) 100%
    );
  height: 100vh;
  padding: 60px 80px;
  width: 100vw;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  --md-theme-default-primary: #4fc08d;
  --md-theme-default-primary-on-background: #4fc08d;
}

body { font-family: 'Source Sans Pro', sans-serif; }

main {
  display: flex;
  justify-content: space-between;

  & > div {
    flex-basis: 30%;
  }
}

.left-side {
  display: flex;
  flex-direction: column;
}

.right-side {
  flex-grow: 1;
}

.title {
  color: #2c3e50;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 6px;

  &.alt {
    font-size: 18px;
    margin-bottom: 10px;
  }
}

.button {
  font-size: .8em;
  cursor: pointer;
  outline: none;
  padding: 0.75em 2em;
  border-radius: 2em;
  display: inline-block;
  color: #fff;
  background-color: #4fc08d;
  transition: all 0.15s ease;
  box-sizing: border-box;
  border: 1px solid #4fc08d;
}

.md-theme-default a.button {
  color: #fff;
}

.md-theme-default a.button:hover {
  text-decoration: none;
  color: #fff;
  opacity: 0.9;
}

.button.alt {
  color: #42b983;
  background-color: transparent;
  text-decoration: none;
}

.button.disabled, .button:disabled {
  pointer-events: none;
  color: #eee;
  opacity: 0.5;
}

</style>
