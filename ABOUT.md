# About page

### If you wish to contribute to this project, join the public Discord server: https://discord.gg/ZTPJ6qSTbF

## Table of content

1. [What is uniqueness rating?](#whatis)
2. [Layers](#layers)
3. [Layer average](#layer-average)
4. [Uniqueness value](#uniqueness-value)
5. [Sample results](./SAMPLES.md)  
6. [Credits](#credits)

---  
</br>

> ## **What is uniqueness rating?** <a name=""></a>
> **Definition:** *"How does this performance compares to the average best performance with a similar mod combination?"*.  
<br/>


**osu! uniqueness rating** (UNR) is an alternative rating system for osu! standard scores, it is designed as an addition to the current performance system such as a **weighting method**, or pure **curiosity stat**.

Uniqueness rates from **0 to 100** on a near-logarithmic scale.  
<br/>

---
<br/>

> ## **Layers** <a name="layers"></a>
> **Definition:** *"A layer is a group of supposedly similar mod combinations leaderboards"*.  
<br/>

For sample quality reasons, the system groups "similar" mod combinations pre-existing scores together, such as the balance between sample **quantity** and sample **quality** is (hopefully) respected as much as possible. However this means that some crucial compromises are made, hence why the layering system is likely subject to change and is **highly experimental**. The layer type is found with the following algorithm:
<br/>

![Layers](https://gameosu.s-ul.eu/EH6FjdZT)
<br/>

Once the layer type of a score has been found, we know exactly what modded leaderboards will be in the layer, so we bundle the corresponding scores alltogether to form our layer of scores.
Every looked up mod combination leaderboard for each layer is as followed (SD and PF are not displayed here but are also looked up for every combination):
<details>
<summary>DTHR Layer</summary>
<ul>
<li>DTHR</li>
<li>HDDTHR</li>
<li>HDNCHR</li>
<li>DTHRNF</li>
<li>NCHRNF</li>
<li>DTHRFL</li>
<li>NCHRFL</li>
<li>HDDTHRNF</li>
<li>HDNCHRNF</li>
<li>HDDTHRFL</li>
<li>HDNCHRFL</li>
</ul>
</details>

<details>
<summary>FL Layer</summary>
<ul>
<li>FL</li>
<li>FLHD</li>
<li>FLHR</li>
<li>FLDT</li>
<li>FLNC</li>
<li>FLEZ</li>
<li>FLHDDT</li>
<li>FLHDNC</li>
<li>FLEZHD</li>
<li>FLHDHR</li>
</ul>
</details>

<details>
<summary>EZ Layer</summary>
<ul>
<li>EZ</li>
<li>EZHD</li>
<li>EZDT</li>
<li>EZNC</li>
<li>EZHDDT</li>
<li>EZHDNC</li>
</ul>
</details>

<details>
<summary>DT Layer</summary>
<ul>
<li>DT</li>
<li>NC</li>
<li>HDDT</li>
<li>HDNC</li>
<li>DTNF</li>
<li>NCNF</li>
<li>HDDTNF</li>
<li>HDNCNF</li>
</ul>
</details>

<details>
<summary>HR Layer</summary>
<ul>
<li>HR</li>
<li>HDHR</li>
<li>HRNF</li>
<li>HRSO</li>
<li>NFHDHR</li>
<li>NFHRSO</li>
</ul>
</details>

<details>
<summary>HD Layer</summary>
<ul>
<li>HD</li>
<li>NFHD</li>
<li>HDSO</li>
<li>NFHDSO</li>
</ul>
</details>

<details>
<summary>HT Layer</summary>
<ul>
<li>HT</li>
<li>HTNF</li>
<li>HTHD</li>
<li>HTHR</li>
<li>HTEZ</li>
<li>HTFL</li>
</ul>
</details>

<details>
<summary>NM Layer</summary>
<ul>
<li>NM</li>
<li>NF</li>
<li>SO</li>
<li>NFSO</li>
</ul>
</details>
<br/>

---
<br/>

> ## **Layer average** <a name="layer-average"></a>
> **Definition:** *"The layer average is the average performance of the best scores on a layered leaderboard"*.  
<br/>

This variable represents the comparison point that will be used to determine uniqueness, basically the more difference between this value and the score, the higher/lower the uniqueness will be.

Layer average is calculated among the following steps, from a layer:
- Scores in the layer are sorted by performance points.
- Following another formula that will be detailed later, a percentile of scores that will be kept from this layer is calculated.
- Only the first x scores from the layer are kept and will be used for the calculation (x = percentile).
- The previous step is also where we remove the score that is currently looked from the layer.
- The average performance of the remaining scores in the layer is calculated, and corresponds to the final Layer average.

The percentile is the most crucial part of this variable, if it's low it will be hard for a score to be unique, and if it's high it will be more gentle. As of now the approach we chose is for the percentile to depend on the whole leaderboard's variance in performance (more precisely, the standard deviation of the whole leaderboard's performance).

The higher the standard deviation ***d*** is, the higher the percentile will be, and conversely. The formula is as followed:

![percentile formula](https://gameosu.s-ul.eu/pwLoYTUb)

Following this formula, the percentile is hard capped at 2 for the minimum value, and at the layer's size for the maximum value. Which means that there will always be at least 2 scores used in the average calculation.  
</br>

---
</br>

> ## **Uniqueness value** <a name="uniqueness-value"></a>
> **Definition:** *"Uniqueness is a near-logarithmic scale that relies on a quotient between a score's performance and a layer's average performance"*.  
</br>

Uniqueness is calculated through a two-step process:
- The first step is to determine the "raw uniqueness", which is basically how much the score's performance stands out (positively or negatively) from the layer's average performance.
- The final step is to make this "raw uniqueness" a 0-100 near-logarithmic scale that is easier to interpret.

The first formula is a straight forward trivial quotient, with variable ***a*** representing the score's pp, and variable ***b*** representing the layer's average pp. We add in a really small value in order to avoid any potential zero division:

![first step of the uniqueness formula](https://gameosu.s-ul.eu/MK5HCVYK)

The second formula is as followed, variable ***x*** representing the previous "raw uniqueness" calculated in the first step:

![second step of the uniqueness formula](https://gameosu.s-ul.eu/ayEqiVO7)  
</br>

---
</br>

> ## **Credits**  <a name="credits"></a>
> *The following contributors have influenced or helped this project, thank you!*  
</br>

+ Maths: Maxdiken, Loazo
+ Coding advice: Nyroux
+ General feedbacks: Mirthille, Zyf
+ Sample submissions: Raijodo, TacosCordoba