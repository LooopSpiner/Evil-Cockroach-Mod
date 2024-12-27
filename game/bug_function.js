window.isBug = function isBug() {
  if (["cockroach", 'bug'].includes(V.houseBug)) {
    return true;
  } else {
    return false;
  }
}

window.createMovingImage = function createMovingImage() {
  window.modImgLoaderHooker.addDynamicImageTagReplacePassage(V.passage);
  const img = document.createElement('img');
  img.style.position = 'absolute';
  document.body.appendChild(img);

  let lastRotation = 0;
  let isDead = false; // 确保 isDead 是全局可访问的
  V.houseBug = V.houseBug || "cirno";
  let bugScale = V.bugScale || 1;
  if (!isBug()){
    img.style.zIndex = 5000;
  }

  if (V.bugScale) {
    img.style.transform = 'scaleX(' + bugScale + ")scaleY(" + bugScale + ")";
  } else if (isBug()) {
    img.style.scale = Math.random() * 1.5 + 1;
  }

  /* 获取base64图片路径 */
  async function getBase64Image(src) {
    return await window.modSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(src);
  }

  /* 图片路径集合 */
  const imgs = {};
  Promise.all([
    getBase64Image("img/misc/bugMod/" + V.houseBug + "/stop.gif"),
    getBase64Image("img/misc/bugMod/" + V.houseBug + "/running.gif"),
    getBase64Image("img/misc/bugMod/" + V.houseBug + "/death.gif")
  ]).then(([stopImg, runningImg, deathImg]) => {
    imgs.stop = stopImg;
    imgs.running = runningImg;
    imgs.death = deathImg;

    img.src = imgs.stop;

    let currentX = Math.random() * window.innerWidth;
    let currentY = Math.random() * window.innerHeight;
    let midX, midY, targetX, targetY;
    let isMoving = false;
    let isFlipped = false;

    function generateRandomTarget() {
      targetX = Math.random() * window.innerWidth;
      targetY = Math.random() * window.innerHeight;

      midX = (currentX + targetX) / 2 + (Math.random() * 500 - 300);
      midY = (currentY + targetY) / 2 + (Math.random() * 500 - 300);

      const moveDuration = Math.random() * 3000 + 2000; // 随机运动时间（2000-5000 毫秒）
      moveToTarget(targetX, targetY, moveDuration);
    }

    function moveToTarget(targetX, targetY, moveDuration) {
      const startX = currentX;
      const startY = currentY;
      const startTime = performance.now();

      function update() {
        if (isDead) return; // 如果死亡状态，停止移动逻辑

        const timeElapsed = performance.now() - startTime;
        const t = Math.min(timeElapsed / moveDuration, 1);

        const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * targetX;
        const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * targetY;

        img.style.left = x + 'px';
        img.style.top = y + 'px';

        if (isBug()) {
          // 实时计算旋转角度
          if (t < 1) {
            const dx = 2 * (1 - t) * (midX - startX) + 2 * t * (targetX - midX);
            const dy = 2 * (1 - t) * (midY - startY) + 2 * t * (targetY - midY);
            let angle = Math.atan2(dy, dx) * 180 / Math.PI; // 计算切线角度
            angle += 90; // 将旋转角度整体加上 90°
            img.style.transform = `rotate(${angle}deg)`; // 根据角度旋转图片
            lastRotation = angle; // 记录旋转角度
          }
        } else {
          // 禁用旋转，设置水平翻转逻辑
          const shouldFlip = targetX < currentX;
          if (shouldFlip !== isFlipped) {
            img.style.transform = shouldFlip ? 'scaleX(' + -bugScale + ")scaleY(" + bugScale + ")" : 'scaleX(' + bugScale + ")scaleY(" + bugScale + ")";
            isFlipped = shouldFlip;
          }
        }

        if (t < 1) {
          requestAnimationFrame(update);
          isMoving = true;
        } else {
          currentX = targetX;
          currentY = targetY;
          isMoving = false;

          const stopDuration = Math.random() * 4000 + 1000; // 随机停止时间（1000-5000 毫秒）
          setTimeout(generateRandomTarget, stopDuration);
        }
      }

      requestAnimationFrame(update);
    }

    function updateImageStatus() {
      if (isDead) {
        return; // 如果进入死亡状态，不再更新其他动画状态
      }

      img.src = isMoving ? imgs.running : imgs.stop;
      if (!isMoving && isBug()) {
        img.style.transform = `rotate(${lastRotation}deg)`; // 停止时保持最后的旋转角度
      }
    }

    setInterval(updateImageStatus, 100);

    function handleInteraction() {
      if (isDead) return; // 如果已经死亡，不重复触发逻辑

      isDead = true; // 标记为死亡状态
      img.src = imgs.death; // 切换到死亡动图

      setTimeout(() => {
        img.remove(); // 在一段时间后移除图片
        isDead = false; // 重置死亡状态，允许后续逻辑再次运行（如果需要）
      }, 1000); // 持续显示死亡动图 5000 毫秒
    }

    img.addEventListener('click', handleInteraction); // 确保事件正确绑定
    img.addEventListener('touchstart', handleInteraction);

    generateRandomTarget();
  });
};

